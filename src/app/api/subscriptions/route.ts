import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';

async function handleGet(request: AuthenticatedRequest) {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`*, field:fields(id, name, location)`)
    .eq('user_id', request.user!.userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  return NextResponse.json({ subscriptions: data || [] });
}

export async function GET(r: NextRequest) { return requireAuth(r, handleGet); }
