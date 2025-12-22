import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateBookingPrice } from '@/lib/utils/pricing';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { field_id, date, start_time, duration, payment_method, user_id } = body;

    // Validation
    if (!field_id || !date || !start_time || !duration || !payment_method) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour réserver' },
        { status: 401 }
      );
    }

    // Validate duration (60 or 90 minutes)
    if (duration !== 60 && duration !== 90) {
      return NextResponse.json(
        { error: 'Durée invalide. Choisissez 1h ou 1h30' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if field exists
    const { data: field, error: fieldError } = await supabase
      .from('fields')
      .select('id, name')
      .eq('id', field_id)
      .single();

    if (fieldError || !field) {
      // If field not in DB, allow booking with field_id (for Petit Camp)
      console.log('Field not found in DB, proceeding with provided field_id');
    }

    // Calculate price
    const amount = calculateBookingPrice(start_time, duration);

    // Calculate end time
    const [hours, minutes] = start_time.split(':').map(Number);
    const startDate = new Date(`2000-01-01T${start_time}:00`);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    const end_time = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    const time_slot = `${start_time} - ${end_time}`;

    // Check if time slot is already booked
    const { data: existingBooking, error: checkError } = await supabase
      .from('bookings')
      .select('id')
      .eq('field_id', field_id)
      .eq('date', date)
      .eq('time_slot', time_slot)
      .in('status', ['pending', 'confirmed'])
      .single();

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Ce créneau est déjà réservé' },
        { status: 400 }
      );
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id,
        field_id,
        date,
        time_slot,
        start_time,
        duration,
        status: 'pending',
        payment_method,
        amount,
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la réservation' },
        { status: 500 }
      );
    }

    // Mark time slot as unavailable
    const { error: timeSlotError } = await supabase
      .from('time_slots')
      .upsert({
        field_id,
        date,
        time: time_slot,
        available: false,
      }, {
        onConflict: 'field_id,date,time'
      });

    if (timeSlotError) {
      console.error('Time slot update error:', timeSlotError);
      // Don't fail the booking if time slot update fails
    }

    return NextResponse.json({
      booking,
      message: 'Réservation créée avec succès',
    });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la réservation' },
      { status: 500 }
    );
  }
}

// GET handler for user bookings
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        field:fields(id, name, location)
      `)
      .eq('user_id', user_id)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Bookings fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bookings: bookings || [] });
  } catch (error) {
    console.error('Bookings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

