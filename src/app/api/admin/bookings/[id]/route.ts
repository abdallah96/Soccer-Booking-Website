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
    const { status } = await request.json();
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

    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ status })
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

