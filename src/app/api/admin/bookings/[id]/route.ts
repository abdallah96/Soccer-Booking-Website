import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { trackEventServer } from '@/lib/utils/analytics-server';
import { requireAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';
import { sanitizeUUID } from '@/lib/utils/sanitize';

async function handlePut(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { status, cancellation_reason } = body;
    const { id: bookingId } = await params;

    if (!status || !['confirmed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be confirmed or cancelled' },
        { status: 400 }
      );
    }

    const sanitizedBookingId = sanitizeUUID(bookingId);
    if (!sanitizedBookingId) {
      return NextResponse.json(
        { error: 'ID de réservation invalide' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Update booking with payment status if confirming; cancellation_reason if cancelling
    const updateData: Record<string, any> = { status };
    if (status === 'confirmed') {
      updateData.payment_status = 'paid';
      updateData.payment_date = new Date().toISOString();
    }
    if (status === 'cancelled' && cancellation_reason != null) {
      updateData.cancellation_reason = String(cancellation_reason).trim() || null;
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', sanitizedBookingId)
      .select()
      .single();

    if (error) {
      console.error('Booking update error:', error);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    // Track booking status change
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookingData = booking as any;
    await trackEventServer(
      'booking',
      status === 'confirmed' ? 'booking_confirmed' : 'booking_cancelled',
      {
        booking_id: sanitizedBookingId,
        booking: bookingData,
        status,
      },
      bookingData?.user_id
    );

    return NextResponse.json({ booking, message: 'Booking updated successfully' });
  } catch (error) {
    console.error('Booking update error:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  params: { params: Promise<{ id: string }> }
) {
  return requireAdmin(request, async (authRequest) => {
    return handlePut(authRequest, params);
  });
}

