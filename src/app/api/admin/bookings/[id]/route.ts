import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const bookingId = params.id;

    if (!status || !['confirmed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be confirmed or cancelled' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('Booking update error:', error);
      return NextResponse.json(
        { error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({ booking, message: 'Booking updated successfully' });
  } catch (error) {
    console.error('Booking update error:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

