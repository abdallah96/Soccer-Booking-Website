import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

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
    const adminSupabase = getAdminClient();

    // Get all bookings for this field and date
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('start_time, duration, time_slot')
      .eq('field_id', fieldId)
      .eq('date', date)
      .in('status', ['pending', 'confirmed']);

    if (bookingsError) {
      console.error('Availability fetch error:', bookingsError);
      return NextResponse.json(
        { error: 'Failed to fetch availability' },
        { status: 500 }
      );
    }

    // Get blocked slots for this date
    const { data: blockedSlotsData, error: blockedError } = await adminSupabase
      .from('blocked_slots')
      .select('start_time, end_time, full_day')
      .eq('field_id', fieldId)
      .eq('date', date);

    // Calculate booked time slots
    const bookedSlots = new Set<string>();
    bookings?.forEach((booking) => {
      bookedSlots.add(booking.start_time);
      // If duration is 90 minutes, also mark the next hour slot as booked
      if (booking.duration === 90) {
        const [hours, minutes] = booking.start_time.split(':').map(Number);
        const nextHour = hours + 1;
        const nextHourStr = `${String(nextHour % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        bookedSlots.add(nextHourStr);
      }
    });

    // Calculate blocked time slots
    const blockedSlots = new Set<string>();
    blockedSlotsData?.forEach((block) => {
      if (block.full_day) {
        // Block all hours for the day
        const allHours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00'];
        allHours.forEach(h => blockedSlots.add(h));
      } else {
        // Parse start and end times
        const [startHour] = block.start_time.split(':').map(Number);
        let [endHour] = block.end_time.split(':').map(Number);
        
        // Handle overnight (e.g., 22:00 to 02:00)
        if (endHour <= startHour) {
          endHour += 24;
        }
        
        for (let h = startHour; h < endHour; h++) {
          const hour = h % 24;
          blockedSlots.add(`${String(hour).padStart(2, '0')}:00`);
        }
      }
    });

    return NextResponse.json({ 
      bookedSlots: Array.from(bookedSlots),
      blockedSlots: Array.from(blockedSlots),
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
