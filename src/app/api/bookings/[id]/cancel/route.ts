import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { trackEventServer } from '@/lib/utils/analytics-server';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { sanitizeUUID } from '@/lib/utils/sanitize';

async function handlePost(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const sanitizedBookingId = sanitizeUUID(bookingId);
    
    if (!sanitizedBookingId) {
      return NextResponse.json(
        { error: 'ID de réservation invalide' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the booking to verify it exists and get user_id
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, user_id, status, field_id, date, time_slot')
      .eq('id', sanitizedBookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Réservation introuvable' },
        { status: 404 }
      );
    }

    // Verify user can only cancel their own bookings
    if (request.user!.userId !== booking.user_id) {
      return NextResponse.json(
        { error: 'Non autorisé à annuler cette réservation' },
        { status: 403 }
      );
    }

    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cette réservation est déjà annulée' },
        { status: 400 }
      );
    }

    // Update booking status to cancelled
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', sanitizedBookingId)
      .select()
      .single();

    if (updateError) {
      console.error('Booking cancellation error:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'annulation de la réservation' },
        { status: 500 }
      );
    }

    // Mark time slot as available again
    const { error: timeSlotError } = await supabase
      .from('time_slots')
      .update({ available: true })
      .eq('field_id', booking.field_id)
      .eq('date', booking.date)
      .eq('time', booking.time_slot);

    if (timeSlotError) {
      console.error('Time slot update error:', timeSlotError);
      // Don't fail the cancellation if time slot update fails
    }

    // Track cancellation server-side
    await trackEventServer(
      'booking',
      'booking_cancelled',
      {
        booking_id: sanitizedBookingId,
        field_id: booking.field_id,
        user_id: booking.user_id,
        date: booking.date,
        time_slot: booking.time_slot,
      },
      booking.user_id
    );

    return NextResponse.json({
      booking: updatedBooking,
      message: 'Réservation annulée avec succès',
    });
  } catch (error) {
    console.error('Booking cancellation error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'annulation de la réservation' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  params: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (authRequest) => {
    return handlePost(authRequest, params);
  });
}

