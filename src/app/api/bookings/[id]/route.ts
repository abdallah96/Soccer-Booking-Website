import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { sanitizeUUID } from '@/lib/utils/sanitize';

/**
 * GET /api/bookings/[id] — fetch a single booking by id (for confirmation page).
 * No auth required so confirmation link works for guests.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const sanitizedId = sanitizeUUID(bookingId);
    if (!sanitizedId) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        id,
        date,
        time_slot,
        start_time,
        duration,
        amount,
        status,
        payment_method,
        payment_expires_at,
        payment_status,
        created_at,
        field:fields(id, name, location),
        user:users(id, name, phone, email)
      `)
      .eq('id', sanitizedId)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { error: 'Réservation introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Booking fetch error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}
