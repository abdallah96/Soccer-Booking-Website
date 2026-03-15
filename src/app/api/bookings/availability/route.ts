import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

// Available hours for booking (18 slots)
const ALL_HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00', '01:00'];
const TOTAL_SLOTS = ALL_HOURS.length;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('field_id');
    const date = searchParams.get('date');
    const monthStart = searchParams.get('month_start'); // For calendar overview
    const monthEnd = searchParams.get('month_end');

    // If requesting monthly overview
    if (fieldId && monthStart && monthEnd) {
      return getMonthlyOverview(fieldId, monthStart, monthEnd);
    }

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

// Get overview for multiple dates (for calendar display)
async function getMonthlyOverview(fieldId: string, monthStart: string, monthEnd: string) {
  try {
    const adminSupabase = getAdminClient();

    // Get all bookings in the date range
    const { data: bookings, error: bookingsError } = await adminSupabase
      .from('bookings')
      .select('date, start_time, duration')
      .eq('field_id', fieldId)
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .in('status', ['pending', 'pending_payment', 'confirmed']);

    if (bookingsError) {
      console.error('Monthly overview fetch error:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    // Get blocked slots in the date range
    const { data: blockedSlots, error: blockedError } = await adminSupabase
      .from('blocked_slots')
      .select('date, start_time, end_time, full_day')
      .eq('field_id', fieldId)
      .gte('date', monthStart)
      .lte('date', monthEnd);

    if (blockedError) {
      console.error('Blocked slots fetch error:', blockedError);
    }

    // Calculate booking info per day
    const bookingInfo: Record<string, { total: number; booked: number; isFullyBooked: boolean }> = {};

    // Initialize all dates in range
    const start = new Date(monthStart);
    const end = new Date(monthEnd);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      bookingInfo[dateStr] = { total: TOTAL_SLOTS, booked: 0, isFullyBooked: false };
    }

    // Count booked slots per day
    bookings?.forEach((booking) => {
      const dateStr = booking.date;
      if (bookingInfo[dateStr]) {
        bookingInfo[dateStr].booked++;
        // If 90 min booking, count as 2 slots
        if (booking.duration === 90) {
          bookingInfo[dateStr].booked++;
        }
      }
    });

    // Count blocked slots per day
    blockedSlots?.forEach((block) => {
      const dateStr = block.date;
      if (bookingInfo[dateStr]) {
        if (block.full_day) {
          bookingInfo[dateStr].booked = TOTAL_SLOTS;
          bookingInfo[dateStr].isFullyBooked = true;
        } else {
          // Count hours blocked
          const [startHour] = block.start_time.split(':').map(Number);
          let [endHour] = block.end_time.split(':').map(Number);
          if (endHour <= startHour) endHour += 24;
          const hoursBlocked = Math.min(endHour - startHour, TOTAL_SLOTS);
          bookingInfo[dateStr].booked += hoursBlocked;
        }
      }
    });

    // Mark fully booked days
    Object.keys(bookingInfo).forEach((dateStr) => {
      if (bookingInfo[dateStr].booked >= TOTAL_SLOTS) {
        bookingInfo[dateStr].isFullyBooked = true;
        bookingInfo[dateStr].booked = TOTAL_SLOTS;
      }
    });

    return NextResponse.json({ bookingInfo });
  } catch (error) {
    console.error('Monthly overview error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
