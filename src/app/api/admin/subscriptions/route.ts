import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';
import { calculateBookingPrice } from '@/lib/utils/pricing';
import { PRICING } from '@/lib/config/constants';

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

async function handleGet(request: AuthenticatedRequest) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`*, user:users(id, name, email, phone), field:fields(id, name)`)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  return NextResponse.json({ subscriptions: data || [] });
}

async function handlePost(request: AuthenticatedRequest) {
  const body = await request.json();
  const { user_id, field_id, day_of_week, start_time, duration, payment_method, discount_percent, start_date, end_date } = body;

  if (!user_id || !field_id || day_of_week === undefined || !start_time || !duration || !start_date) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
  }

  const supabase = getAdminClient();

  // Calculate first booking date from start_date
  const startD = new Date(start_date + 'T12:00:00');
  const targetDay = Number(day_of_week);
  let diff = targetDay - startD.getDay();
  if (diff < 0) diff += 7;
  if (diff === 0 && startD < new Date()) diff = 7;
  const nextBookingDate = new Date(startD);
  nextBookingDate.setDate(startD.getDate() + diff);
  const nextBookingDateStr = nextBookingDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id, field_id,
      day_of_week: Number(day_of_week),
      start_time, duration: Number(duration),
      payment_method: payment_method || 'wave',
      discount_percent: Number(discount_percent ?? 10),
      status: 'active', start_date,
      end_date: end_date || null,
      next_booking_date: nextBookingDateStr,
    })
    .select(`*, user:users(id, name, email, phone), field:fields(id, name)`)
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur création abonnement' }, { status: 500 });
  }

  // Immediately create the first booking
  await createNextBooking(data, supabase);

  return NextResponse.json({ subscription: data }, { status: 201 });
}

async function handlePut(request: AuthenticatedRequest) {
  const body = await request.json();
  const { id, status, end_date, discount_percent } = body;
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

  const supabase = getAdminClient();
  const updates: any = { updated_at: new Date().toISOString() };
  if (status) updates.status = status;
  if (end_date !== undefined) updates.end_date = end_date;
  if (discount_percent !== undefined) updates.discount_percent = Number(discount_percent);

  const { data, error } = await supabase
    .from('subscriptions').update(updates).eq('id', id)
    .select(`*, user:users(id, name, email, phone), field:fields(id, name)`).single();

  if (error) return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 });
  return NextResponse.json({ subscription: data });
}

export async function GET(r: NextRequest) { return requireAdmin(r, handleGet); }
export async function POST(r: NextRequest) { return requireAdmin(r, handlePost); }
export async function PUT(r: NextRequest) { return requireAdmin(r, handlePut); }

// ─── Helper: create a booking for the subscription ───────────────────────────
export async function createNextBooking(sub: any, supabase: any) {
  try {
    if (!sub.next_booking_date || sub.status !== 'active') return;
    if (sub.end_date && sub.next_booking_date > sub.end_date) return;

    const { data: field } = await supabase
      .from('fields').select('price_per_hour').eq('id', sub.field_id).single();

    const base = field?.price_per_hour || PRICING.DEFAULT_DAY_RATE;
    const fullPrice = calculateBookingPrice(sub.start_time, sub.duration, base);
    const discountedPrice = Math.round(fullPrice * (1 - (sub.discount_percent || 0) / 100));

    const endMins = sub.duration;
    const [hh, mm] = sub.start_time.split(':').map(Number);
    const endDate = new Date(2000, 0, 1, hh, mm + endMins);
    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    const timeSlot = `${sub.start_time} - ${endTime}`;

    const paymentExpiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // Check slot isn't already booked
    const { data: existing } = await supabase
      .from('bookings').select('id').eq('field_id', sub.field_id)
      .eq('date', sub.next_booking_date).eq('time_slot', timeSlot)
      .in('status', ['pending', 'pending_payment', 'confirmed']).single();

    if (existing) {
      console.warn(`Subscription ${sub.id}: slot already booked for ${sub.next_booking_date}`);
      return;
    }

    await supabase.from('bookings').insert({
      user_id: sub.user_id, field_id: sub.field_id,
      date: sub.next_booking_date, time_slot: timeSlot,
      start_time: sub.start_time, duration: sub.duration,
      status: 'pending_payment',
      payment_method: sub.payment_method,
      amount: discountedPrice,
      payment_status: 'unpaid',
      payment_expires_at: paymentExpiresAt,
    });

    // Advance next_booking_date by 7 days
    const next = new Date(sub.next_booking_date + 'T12:00:00');
    next.setDate(next.getDate() + 7);
    const nextStr = next.toISOString().split('T')[0];

    // Stop if past end_date
    const shouldContinue = !sub.end_date || nextStr <= sub.end_date;
    await supabase.from('subscriptions').update({
      next_booking_date: shouldContinue ? nextStr : null,
      status: shouldContinue ? 'active' : 'cancelled',
    }).eq('id', sub.id);
  } catch (err) {
    console.error('createNextBooking error:', err);
  }
}
