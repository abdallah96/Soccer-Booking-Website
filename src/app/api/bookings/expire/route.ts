import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

// This route auto-cancels bookings where payment_expires_at has passed.
// Call it from a Vercel cron job (vercel.json) or from the booking creation flow.
// Protected by a shared secret to prevent abuse.
export async function POST(request: NextRequest) {
  try {
    // Simple secret check — set CRON_SECRET in your env
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getAdminClient();
    const now = new Date().toISOString();

    // Find all expired pending_payment bookings
    const { data: expiredBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, field_id, date, time_slot')
      .eq('status', 'pending_payment')
      .lt('payment_expires_at', now);

    if (fetchError) {
      console.error('Error fetching expired bookings:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch expired bookings' }, { status: 500 });
    }

    if (!expiredBookings || expiredBookings.length === 0) {
      return NextResponse.json({ cancelled: 0, message: 'No expired bookings found' });
    }

    const expiredIds = expiredBookings.map((b) => b.id);

    // Cancel all expired bookings
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_by: 'system',
        cancellation_reason: 'Délai de paiement expiré (30 minutes)',
        updated_at: now,
      })
      .in('id', expiredIds);

    if (updateError) {
      console.error('Error cancelling expired bookings:', updateError);
      return NextResponse.json({ error: 'Failed to cancel expired bookings' }, { status: 500 });
    }

    // Free up the time slots
    for (const booking of expiredBookings) {
      await supabase
        .from('time_slots')
        .update({ available: true })
        .eq('field_id', booking.field_id)
        .eq('date', booking.date)
        .eq('time', booking.time_slot);
    }

    console.log(`Auto-cancelled ${expiredIds.length} expired bookings`);

    return NextResponse.json({
      cancelled: expiredIds.length,
      booking_ids: expiredIds,
      message: `${expiredIds.length} réservation(s) expirée(s) annulée(s)`,
    });
  } catch (error) {
    console.error('Expire bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also expose as GET for easy cron calling
export async function GET(request: NextRequest) {
  return POST(request);
}
