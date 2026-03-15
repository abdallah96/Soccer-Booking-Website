import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { verifyAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const { user, error: authError } = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const supabase = getAdminClient();
    
    // Get blocked slots (no date limit for admin - can see all future blocks)
    const today = new Date();

    const { data: blockedSlots, error } = await supabase
      .from('blocked_slots')
      .select('*')
      .gte('date', today.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching blocked slots:', error);
      return NextResponse.json(
        { error: 'Failed to fetch blocked slots' },
        { status: 500 }
      );
    }

    return NextResponse.json({ blockedSlots });
  } catch (error) {
    console.error('Error in GET /api/admin/blocked-slots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const { user, error: authError } = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { field_id, date, start_time, end_time, full_day, reason } = body;

    if (!field_id || !date) {
      return NextResponse.json(
        { error: 'Field ID and date are required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    const { data: blockedSlot, error } = await supabase
      .from('blocked_slots')
      .insert({
        field_id,
        date,
        start_time: start_time || '08:00',
        end_time: end_time || '02:00',
        full_day: full_day || false,
        reason: reason || null,
        created_by: user.userId,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating blocked slot:', error);
      return NextResponse.json(
        { error: 'Failed to create blocked slot' },
        { status: 500 }
      );
    }

    return NextResponse.json({ blockedSlot }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/blocked-slots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
