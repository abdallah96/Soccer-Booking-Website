import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';

type Booking = {
  id: string;
  status: string;
  amount: number | string;
  field_id: string;
  date: string;
  time_slot: string;
  start_time: string;
  user_id: string;
  created_at: string;
};

type Field = { id: string; name: string };

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

async function handleGet(request: AuthenticatedRequest) {
  try {
    const supabase = getAdminClient();

    const [{ data: bookings, error: bErr }, { data: fields, error: fErr }] = await Promise.all([
      supabase.from('bookings').select('id, status, amount, field_id, date, time_slot, start_time, user_id, created_at'),
      supabase.from('fields').select('id, name'),
    ]);

    if (bErr) return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    if (fErr) return NextResponse.json({ error: 'Failed to fetch fields' }, { status: 500 });

    const all = (bookings || []) as Booking[];
    const typedFields = (fields || []) as Field[];

    const now = new Date();
    const weekStart = startOfWeek(now);
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);

    const confirmed = all.filter(b => b.status === 'confirmed');
    const pending = all.filter(b => b.status === 'pending' || b.status === 'pending_payment');
    const cancelled = all.filter(b => b.status === 'cancelled');

    const amt = (b: Booking) => Number(b.amount) || 0;

    const totalRevenue = confirmed.reduce((s, b) => s + amt(b), 0);
    const pendingRevenue = pending.reduce((s, b) => s + amt(b), 0);
    const cancelledRevenue = cancelled.reduce((s, b) => s + amt(b), 0);

    const revenueThisWeek = confirmed
      .filter(b => new Date(b.created_at) >= weekStart)
      .reduce((s, b) => s + amt(b), 0);

    const revenueLast30 = confirmed
      .filter(b => new Date(b.created_at) >= thirtyDaysAgo)
      .reduce((s, b) => s + amt(b), 0);

    // Cancellation rate
    const decidedCount = confirmed.length + cancelled.length;
    const cancellationRate = decidedCount > 0 ? Math.round((cancelled.length / decidedCount) * 100) : 0;

    // Occupation rate (last 30 days): confirmed / (confirmed + cancelled + pending)
    const recent = all.filter(b => new Date(b.created_at) >= thirtyDaysAgo);
    const recentConfirmed = recent.filter(b => b.status === 'confirmed').length;
    const occupationRate = recent.length > 0 ? Math.round((recentConfirmed / recent.length) * 100) : 0;

    // Unique and recurring clients
    const userBookingCount: Record<string, number> = {};
    confirmed.forEach(b => {
      userBookingCount[b.user_id] = (userBookingCount[b.user_id] || 0) + 1;
    });
    const totalUniqueClients = Object.keys(userBookingCount).length;
    const recurringClients = Object.values(userBookingCount).filter(c => c >= 2).length;

    // Popular time slots (top 5 most booked start_time among confirmed)
    const slotCounts: Record<string, number> = {};
    confirmed.forEach(b => {
      const key = b.start_time || b.time_slot?.split(' ')[0] || 'unknown';
      slotCounts[key] = (slotCounts[key] || 0) + 1;
    });
    const popularSlots = Object.entries(slotCounts)
      .map(([slot, count]) => ({ slot, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Popular fields
    const fieldCounts: Record<string, { count: number; name: string }> = {};
    all.forEach(b => {
      if (!b.field_id) return;
      const name = typedFields.find(f => f.id === b.field_id)?.name || 'Unknown';
      if (!fieldCounts[b.field_id]) fieldCounts[b.field_id] = { count: 0, name };
      fieldCounts[b.field_id].count++;
    });
    const popularFields = Object.entries(fieldCounts)
      .map(([field_id, d]) => ({ field_id, name: d.name, bookings_count: d.count }))
      .sort((a, b) => b.bookings_count - a.bookings_count)
      .slice(0, 5);

    // Monthly revenue (last 6 months)
    const monthlyRevenue: { month: string; revenue: number; bookings: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const mBookings = confirmed.filter(b => {
        const cd = new Date(b.created_at);
        return cd >= mStart && cd <= mEnd;
      });
      monthlyRevenue.push({
        month: monthStr,
        revenue: mBookings.reduce((s, b) => s + amt(b), 0),
        bookings: mBookings.length,
      });
    }

    // Weekly revenue (last 8 weeks)
    const weeklyRevenue: { week: string; revenue: number; bookings: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const wStart = new Date(weekStart);
      wStart.setDate(wStart.getDate() - i * 7);
      const wEnd = new Date(wStart);
      wEnd.setDate(wEnd.getDate() + 6);
      wEnd.setHours(23, 59, 59);
      const label = `${wStart.getDate()}/${wStart.getMonth() + 1}`;
      const wBookings = confirmed.filter(b => {
        const cd = new Date(b.created_at);
        return cd >= wStart && cd <= wEnd;
      });
      weeklyRevenue.push({
        week: label,
        revenue: wBookings.reduce((s, b) => s + amt(b), 0),
        bookings: wBookings.length,
      });
    }

    // Recent bookings (last 10)
    const recentBookings = [...all]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return NextResponse.json({
      stats: {
        total_bookings: all.length,
        confirmed_bookings: confirmed.length,
        pending_bookings: pending.length,
        cancelled_bookings: cancelled.length,
        total_revenue: totalRevenue,
        pending_revenue: pendingRevenue,
        cancelled_revenue: cancelledRevenue,
        revenue_this_week: revenueThisWeek,
        revenue_last_30_days: revenueLast30,
        cancellation_rate: cancellationRate,
        occupation_rate: occupationRate,
        total_unique_clients: totalUniqueClients,
        recurring_clients: recurringClients,
        total_fields: typedFields.length,
      },
      popular_fields: popularFields,
      popular_slots: popularSlots,
      monthly_revenue: monthlyRevenue,
      weekly_revenue: weeklyRevenue,
      recent_bookings: recentBookings,
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return requireAdmin(request, handleGet);
}
