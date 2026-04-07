import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { trackEventServer } from '@/lib/utils/analytics-server';
import { requireAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';
import { sanitizeUUID } from '@/lib/utils/sanitize';

const LOYALTY_THRESHOLD = 10;

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'PC-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function checkAndGenerateLoyaltyCode(supabase: any, userId: string) {
  try {
    const { count } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'confirmed');

    if (!count || count < LOYALTY_THRESHOLD) return null;

    const expectedCodes = Math.floor(count / LOYALTY_THRESHOLD);

    const { count: existingCodes } = await supabase
      .from('discount_codes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if ((existingCodes || 0) >= expectedCodes) return null;

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 3);

    const { data: newCode, error } = await supabase
      .from('discount_codes')
      .insert({
        code: generateCode(),
        user_id: userId,
        discount_type: 'free_session',
        discount_value: 100,
        is_used: false,
        expires_at: expiresAt.toISOString(),
        threshold_reached: count,
      })
      .select()
      .single();

    if (error) {
      console.error('Loyalty code generation error:', error);
      return null;
    }

    return newCode;
  } catch (e) {
    console.error('Loyalty check error:', e);
    return null;
  }
}

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

    const bookingData = booking as any;

    let loyaltyCode = null;
    if (status === 'confirmed' && bookingData?.user_id) {
      loyaltyCode = await checkAndGenerateLoyaltyCode(supabase, bookingData.user_id);
    }

    await trackEventServer(
      'booking',
      status === 'confirmed' ? 'booking_confirmed' : 'booking_cancelled',
      {
        booking_id: sanitizedBookingId,
        booking: bookingData,
        status,
        loyalty_code_generated: !!loyaltyCode,
      },
      bookingData?.user_id
    );

    return NextResponse.json({
      booking,
      message: 'Booking updated successfully',
      loyalty_code: loyaltyCode,
    });
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
