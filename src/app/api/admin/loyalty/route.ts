import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';

const LOYALTY_THRESHOLD = 10;

async function handleGet(request: AuthenticatedRequest) {
  try {
    const supabase = getAdminClient();

    const { data: users, error: usersErr } = await supabase
      .from('users')
      .select('id, name, phone, email')
      .eq('role', 'user');

    if (usersErr) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const { data: bookings } = await supabase
      .from('bookings')
      .select('user_id, status')
      .eq('status', 'confirmed');

    const { data: codes } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });

    const bookingCounts: Record<string, number> = {};
    (bookings || []).forEach((b: any) => {
      bookingCounts[b.user_id] = (bookingCounts[b.user_id] || 0) + 1;
    });

    const codesByUser: Record<string, any[]> = {};
    (codes || []).forEach((c: any) => {
      if (!codesByUser[c.user_id]) codesByUser[c.user_id] = [];
      codesByUser[c.user_id].push(c);
    });

    const loyalty = (users || []).map((u: any) => {
      const confirmed = bookingCounts[u.id] || 0;
      const userCodes = codesByUser[u.id] || [];
      const codesGenerated = userCodes.length;
      const codesUsed = userCodes.filter((c: any) => c.is_used).length;
      const codesAvailable = userCodes.filter((c: any) => !c.is_used).length;
      const nextReward = LOYALTY_THRESHOLD - (confirmed % LOYALTY_THRESHOLD);

      return {
        user_id: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email,
        confirmed_bookings: confirmed,
        codes_generated: codesGenerated,
        codes_used: codesUsed,
        codes_available: codesAvailable,
        next_reward_in: nextReward === LOYALTY_THRESHOLD ? LOYALTY_THRESHOLD : nextReward,
        discount_codes: userCodes,
      };
    }).filter((u: any) => u.confirmed_bookings > 0)
      .sort((a: any, b: any) => b.confirmed_bookings - a.confirmed_bookings);

    return NextResponse.json({
      loyalty,
      threshold: LOYALTY_THRESHOLD,
      total_codes_generated: (codes || []).length,
      total_codes_used: (codes || []).filter((c: any) => c.is_used).length,
    });
  } catch (error) {
    console.error('Loyalty fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch loyalty data' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return requireAdmin(request, handleGet);
}
