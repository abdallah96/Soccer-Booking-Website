import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';

async function handleGet(request: AuthenticatedRequest) {
  try {
    const supabase = getAdminClient();

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        user:users(id, name, email, phone)
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

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

async function handlePost(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { user_id, field_id, date, start_time, duration, payment_method, status = 'confirmed' } = body;

    if (!user_id || !field_id || !date || !start_time || !duration || !payment_method) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    const { createClient } = await import('@/lib/supabase/server');
    const userSupabase = await createClient();

    // Get field to calculate price
    const { data: field } = await supabase
      .from('fields')
      .select('price_per_hour')
      .eq('id', field_id)
      .single();

    const { calculateBookingPrice } = await import('@/lib/utils/pricing');
    const { PRICING } = await import('@/lib/config/constants');
    const basePricePerHour = field?.price_per_hour || PRICING.DEFAULT_DAY_RATE;
    const amount = calculateBookingPrice(start_time, duration, basePricePerHour);

    // Calculate end time
    const [hours, minutes] = start_time.split(':').map(Number);
    const startDate = new Date(`2000-01-01T${start_time}:00`);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    const end_time = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    const time_slot = `${start_time} - ${end_time}`;

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
        status,
        payment_method,
        amount,
      })
      .select(`
        *,
        user:users(id, name, email, phone)
      `)
      .single();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la réservation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('Booking creation error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de la réservation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return requireAdmin(request, handleGet);
}

export async function POST(request: NextRequest) {
  return requireAdmin(request, handlePost);
}

