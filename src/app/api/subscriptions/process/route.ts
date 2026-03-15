import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { createNextBooking } from '@/app/api/admin/subscriptions/route';

// Called by Vercel cron daily — creates bookings for subscriptions whose next_booking_date is within 7 days
export async function GET(request: NextRequest) {
  return POST(request);
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getAdminClient();
    const today = new Date().toISOString().split('T')[0];
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    const in7DaysStr = in7Days.toISOString().split('T')[0];

    // Find active subscriptions whose next booking is due within 7 days
    const { data: subs, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .lte('next_booking_date', in7DaysStr)
      .not('next_booking_date', 'is', null);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    let created = 0;
    for (const sub of subs || []) {
      await createNextBooking(sub, supabase);
      created++;
    }

    return NextResponse.json({
      processed: subs?.length || 0,
      bookings_created: created,
      message: `${created} booking(s) créé(s) pour les abonnements actifs`,
    });
  } catch (err) {
    console.error('Subscription cron error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
