import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { calculateBookingPrice } from '@/lib/utils/pricing';
import { trackEventServer } from '@/lib/utils/analytics-server';
import { PRICING } from '@/lib/config/constants';
import { requireAuth, verifyAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { sanitizeUUID, sanitizeDate, sanitizeTime, sanitizeNumber, sanitizeString, sanitizePhone, sanitizeEmail } from '@/lib/utils/sanitize';
import bcrypt from 'bcryptjs';

async function handlePost(request: NextRequest) {
  try {
    const body = await request.json();
    const { field_id, date, start_time, duration = 60, payment_method = 'wave', phone, name, email } = body;

    const { user: authUser } = await verifyAuth(request);
    let user_id: string;

    if (authUser) {
      user_id = authUser.userId;
    } else {
      // Guest booking: phone required
      if (!phone) {
        return NextResponse.json(
          { error: 'Numéro de téléphone requis pour la réservation' },
          { status: 400 }
        );
      }
      const sanitizedPhone = sanitizePhone(phone);
      if (!sanitizedPhone || sanitizedPhone.length < 8) {
        return NextResponse.json(
          { error: 'Numéro de téléphone invalide' },
          { status: 400 }
        );
      }
      const adminSupabase = getAdminClient();
      const { data: existingUser } = await adminSupabase
        .from('users')
        .select('id')
        .or(`phone.eq.${sanitizedPhone},phone.eq.${sanitizedPhone.replace(/\s/g, '')}`)
        .limit(1)
        .maybeSingle();

      if (existingUser) {
        user_id = existingUser.id;
      } else {
        const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const userEmail = email ? sanitizeEmail(email) : `${sanitizedPhone.replace(/\D/g, '')}@petitcamp.sn`;
        const userName = name ? sanitizeString(name) : `Client ${sanitizedPhone.slice(-4)}`;
        const { data: newUser, error: createError } = await adminSupabase
          .from('users')
          .insert({
            email: userEmail,
            name: userName,
            phone: sanitizedPhone,
            password_hash: hashedPassword,
            role: 'user',
          })
          .select('id')
          .single();
        if (createError || !newUser) {
          console.error('Error creating user:', createError);
          return NextResponse.json(
            { error: 'Erreur lors de la création du compte' },
            { status: 500 }
          );
        }
        user_id = newUser.id;
      }
    }

    // Validation and sanitization
    if (!field_id || !date || !start_time) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    const sanitizedFieldId = sanitizeUUID(field_id);
    if (!sanitizedFieldId) {
      return NextResponse.json(
        { error: 'ID de terrain invalide' },
        { status: 400 }
      );
    }

    const sanitizedDate = sanitizeDate(date);
    if (!sanitizedDate) {
      return NextResponse.json(
        { error: 'Date invalide' },
        { status: 400 }
      );
    }

    const sanitizedTime = sanitizeTime(start_time);
    if (!sanitizedTime) {
      return NextResponse.json(
        { error: 'Heure invalide' },
        { status: 400 }
      );
    }

    const sanitizedDuration = sanitizeNumber(duration, 60, 90);
    if (!sanitizedDuration || (sanitizedDuration !== 60 && sanitizedDuration !== 90)) {
      return NextResponse.json(
        { error: 'Durée invalide. Choisissez 1h ou 1h30' },
        { status: 400 }
      );
    }

    if (!['wave', 'orange_money', 'cash'].includes(payment_method)) {
      return NextResponse.json(
        { error: 'Méthode de paiement invalide' },
        { status: 400 }
      );
    }

    const db = getAdminClient();
    const { data: field, error: fieldError } = await db
      .from('fields')
      .select('id, name, price_per_hour')
      .eq('id', sanitizedFieldId)
      .single();

    const basePricePerHour = field?.price_per_hour || PRICING.DEFAULT_DAY_RATE;

    if (fieldError || !field) {
      console.log('Field not found in DB, proceeding with provided field_id');
    }

    const amount = calculateBookingPrice(sanitizedTime, sanitizedDuration, basePricePerHour);

    const [hours, minutes] = sanitizedTime.split(':').map(Number);
    const startDate = new Date(`2000-01-01T${sanitizedTime}:00`);
    const endDate = new Date(startDate.getTime() + sanitizedDuration * 60000);
    const end_time = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    const time_slot = `${sanitizedTime} - ${end_time}`;

    const { data: existingBooking } = await db
      .from('bookings')
      .select('id')
      .eq('field_id', sanitizedFieldId)
      .eq('date', sanitizedDate)
      .eq('time_slot', time_slot)
      .in('status', ['pending', 'pending_payment', 'confirmed'])
      .maybeSingle();

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Ce créneau est déjà réservé' },
        { status: 400 }
      );
    }

    const paymentExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { data: booking, error: bookingError } = await db
      .from('bookings')
      .insert({
        user_id,
        field_id: sanitizedFieldId,
        date: sanitizedDate,
        time_slot,
        start_time: sanitizedTime,
        duration: sanitizedDuration,
        status: 'pending_payment',
        payment_method,
        amount,
        payment_status: 'unpaid',
        payment_expires_at: paymentExpiresAt,
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

    const { error: timeSlotError } = await db
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

    // Track booking creation server-side
    await trackEventServer('booking', 'booking_created', {
      booking_id: booking.id,
      field_id: sanitizedFieldId,
      user_id: user_id,
      date: sanitizedDate,
      start_time: sanitizedTime,
      duration: sanitizedDuration,
      payment_method,
      amount,
      success: true,
    }, user_id);

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
async function handleGet(request: AuthenticatedRequest) {
  try {
    // Get user_id from authenticated user (secure)
    const user_id = request.user!.userId;

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

export async function POST(request: NextRequest) {
  return handlePost(request);
}

export async function GET(request: NextRequest) {
  return requireAuth(request, handleGet);
}

