import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fieldId = searchParams.get('field_id');
  if (!fieldId) return NextResponse.json({ rules: [] });

  const supabase = getAdminClient();
  const { data } = await supabase
    .from('pricing_rules')
    .select('*')
    .eq('field_id', fieldId)
    .eq('is_active', true)
    .order('hour_start');

  return NextResponse.json({ rules: data || [] });
}
