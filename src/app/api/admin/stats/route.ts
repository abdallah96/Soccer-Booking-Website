import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';

async function handleGet(request: AuthenticatedRequest) {
  try {
    const supabase = getAdminClient();

    // Get all bookings
    // @ts-ignore - Supabase types don't work well with service role client
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, status, amount, field_id, date, created_at');

    if (bookingsError) {
      console.error('Bookings fetch error:', bookingsError);
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    // Get all fields
    // @ts-ignore
    const { data: fields, error: fieldsError } = await supabase
      .from('fields')
      .select('id, name');

    // Type assertions for TypeScript
    type Booking = {
      id: string;
      status: string;
      amount: number | string;
      field_id: string;
      date: string;
      created_at: string;
    };

    type Field = {
      id: string;
      name: string;
    };

    const typedBookings = (bookings || []) as Booking[];
    const typedFields = (fields || []) as Field[];

    if (fieldsError) {
      console.error('Fields fetch error:', fieldsError);
      return NextResponse.json(
        { error: 'Failed to fetch fields' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const totalBookings = typedBookings.length;
    const confirmedBookings = typedBookings.filter((b) => b.status === 'confirmed');
    const pendingBookings = typedBookings.filter((b) => b.status === 'pending');
    const cancelledBookings = typedBookings.filter((b) => b.status === 'cancelled');

    // Calculate revenue (only from confirmed bookings)
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

    // Calculate revenue for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentBookings = confirmedBookings.filter(
      (b) => new Date(b.created_at) >= thirtyDaysAgo
    );
    const revenueLast30Days = recentBookings.reduce(
      (sum, b) => sum + (Number(b.amount) || 0),
      0
    );

    // Get popular fields (most booked)
    const fieldBookingCounts: Record<string, { count: number; name: string }> = {};
    typedBookings.forEach((booking) => {
      if (booking.field_id) {
        const fieldName = typedFields.find((f) => f.id === booking.field_id)?.name || 'Unknown';
        if (!fieldBookingCounts[booking.field_id]) {
          fieldBookingCounts[booking.field_id] = { count: 0, name: fieldName };
        }
        fieldBookingCounts[booking.field_id].count++;
      }
    });

    const popularFields = Object.entries(fieldBookingCounts)
      .map(([fieldId, data]) => ({
        field_id: fieldId,
        name: data.name,
        bookings_count: data.count,
      }))
      .sort((a, b) => b.bookings_count - a.bookings_count)
      .slice(0, 5);

    // Get recent bookings (last 10)
    const recentBookingsList = typedBookings
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return NextResponse.json({
      stats: {
        total_bookings: totalBookings,
        confirmed_bookings: confirmedBookings.length,
        pending_bookings: pendingBookings.length,
        cancelled_bookings: cancelledBookings.length,
        total_revenue: totalRevenue,
        revenue_last_30_days: revenueLast30Days,
        total_fields: typedFields.length,
      },
      popular_fields: popularFields,
      recent_bookings: recentBookingsList,
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return requireAdmin(request, handleGet);
}

