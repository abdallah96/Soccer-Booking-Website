import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

// Helper to get Monday of a given week (returns YYYY-MM-DD string)
function getWeekStartString(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const dayOfWeek = date.getDay();
  const diff = day - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(year, month, diff);
  const yyyy = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Helper to check if a date is in an open week
export async function isWeekOpen(fieldId: string, date: Date): Promise<boolean> {
  const supabase = getAdminClient();
  const weekStart = getWeekStartString(date);

  const { data: week } = await supabase
    .from('week_availability')
    .select('is_open')
    .eq('field_id', fieldId)
    .eq('week_start_date', weekStart)
    .single();

  // If no record exists, default to open (backward compatibility)
  return week?.is_open !== false;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('field_id');
    const date = searchParams.get('date');

    if (!fieldId) {
      return NextResponse.json(
        { error: 'Field ID is required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Get availability for current week + next week (2 weeks total)
    const today = new Date();
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(today.getDate() + 14);

    const weekStarts: string[] = [];
    let currentDate = new Date(today);
    
    // Get all week starts for the next 2 weeks
    for (let i = 0; i < 2; i++) {
      const weekStart = getWeekStartString(currentDate);
      weekStarts.push(weekStart);
      currentDate.setDate(currentDate.getDate() + 7);
    }

    const { data: weeks, error } = await supabase
      .from('week_availability')
      .select('week_start_date, is_open')
      .eq('field_id', fieldId)
      .in('week_start_date', weekStarts);

    if (error) {
      console.error('Error fetching week availability:', error);
      // Default to all weeks open if error
      return NextResponse.json({ 
        weeks: weekStarts.map(ws => ({ week_start_date: ws, is_open: true }))
      });
    }

    // Create a map of week availability
    const weekMap = new Map(
      (weeks || []).map(w => [w.week_start_date, w.is_open !== false])
    );

    // Fill in missing weeks as open (default)
    const result = weekStarts.map(ws => ({
      week_start_date: ws,
      is_open: weekMap.get(ws) !== false, // Default to true if not set
    }));

    // If checking a specific date, return just that week's status
    if (date) {
      const checkDate = new Date(date);
      const checkWeekStart = getWeekStartString(checkDate);
      const weekStatus = result.find(w => w.week_start_date === checkWeekStart);
      return NextResponse.json({ 
        is_open: weekStatus?.is_open !== false,
        week_start_date: checkWeekStart
      });
    }

    return NextResponse.json({ weeks: result });
  } catch (error) {
    console.error('Error in GET /api/week-availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

