import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { verifyAuth } from '@/lib/middleware/auth';

// Helper to get Monday of a given week
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('field_id');

    if (!fieldId) {
      return NextResponse.json(
        { error: 'Field ID is required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Get availability for next 12 weeks
    const today = new Date();
    const twelveWeeksLater = new Date();
    twelveWeeksLater.setDate(today.getDate() + 84);

    const { data: weeks, error } = await supabase
      .from('week_availability')
      .select('*')
      .eq('field_id', fieldId)
      .gte('week_start_date', getWeekStart(today).toISOString().split('T')[0])
      .lte('week_start_date', getWeekStart(twelveWeeksLater).toISOString().split('T')[0])
      .order('week_start_date', { ascending: true });

    if (error) {
      console.error('Error fetching week availability:', error);
      return NextResponse.json(
        { error: 'Failed to fetch week availability' },
        { status: 500 }
      );
    }

    return NextResponse.json({ weeks: weeks || [] });
  } catch (error) {
    console.error('Error in GET /api/admin/week-availability:', error);
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
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { field_id, week_start_date, is_open } = body;

    if (!field_id || !week_start_date) {
      return NextResponse.json(
        { error: 'Field ID and week start date are required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    const weekStart = getWeekStart(new Date(week_start_date));

    const { data: week, error } = await supabase
      .from('week_availability')
      .upsert({
        field_id,
        week_start_date: weekStart.toISOString().split('T')[0],
        is_open: is_open !== undefined ? is_open : true,
        created_by: user.userId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'field_id,week_start_date',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating/updating week availability:', error);
      return NextResponse.json(
        { error: 'Failed to update week availability' },
        { status: 500 }
      );
    }

    return NextResponse.json({ week }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/week-availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

