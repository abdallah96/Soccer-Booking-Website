import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('field_id');
    const date = searchParams.get('date');

    if (!fieldId || !date) {
      return NextResponse.json(
        { error: 'field_id and date are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get all bookings for this field and date
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('start_time, duration, time_slot')
      .eq('field_id', fieldId)
      .eq('date', date)
      .in('status', ['pending', 'confirmed']);

    if (error) {
      console.error('Availability fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch availability' },
        { status: 500 }
      );
    }

    // Calculate booked time slots
    const bookedSlots = new Set<string>();
    bookings?.forEach((booking) => {
      bookedSlots.add(booking.start_time);
      // If duration is 90 minutes, also mark the next hour slot as booked
      if (booking.duration === 90) {
        const [hours, minutes] = booking.start_time.split(':').map(Number);
        // Calculate next hour (handle 24-hour wrap)
        const nextHour = hours + 1;
        const nextHourStr = `${String(nextHour % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        bookedSlots.add(nextHourStr);
      }
    });

    return NextResponse.json({ 
      bookedSlots: Array.from(bookedSlots),
      bookings: bookings || []
    });
  } catch (error) {
    console.error('Availability fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

