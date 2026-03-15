import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';

async function handleGet(request: AuthenticatedRequest) {
  const supabase = getAdminClient();
  const { searchParams } = new URL(request.url);
  const fieldId = searchParams.get('field_id');

  let query = supabase.from('pricing_rules').select('*').order('hour_start');
  if (fieldId) query = query.eq('field_id', fieldId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  return NextResponse.json({ rules: data || [] });
}

async function handlePost(request: AuthenticatedRequest) {
  const body = await request.json();
  const { field_id, name, day_type, hour_start, hour_end, price_per_hour } = body;

  if (!field_id || !name || !day_type || hour_start === undefined || hour_end === undefined || !price_per_hour) {
    return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
  }
  if (!['weekday', 'weekend', 'all'].includes(day_type)) {
    return NextResponse.json({ error: 'day_type invalide' }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('pricing_rules')
    .insert({ field_id, name, day_type, hour_start: Number(hour_start), hour_end: Number(hour_end), price_per_hour: Number(price_per_hour), is_active: true })
    .select().single();

  if (error) return NextResponse.json({ error: 'Erreur création' }, { status: 500 });
  return NextResponse.json({ rule: data }, { status: 201 });
}

async function handlePut(request: AuthenticatedRequest) {
  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('pricing_rules').update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();

  if (error) return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 });
  return NextResponse.json({ rule: data });
}

async function handleDelete(request: AuthenticatedRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID requis' }, { status: 400 });

  const supabase = getAdminClient();
  const { error } = await supabase.from('pricing_rules').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 });
  return NextResponse.json({ message: 'Règle supprimée' });
}

export async function GET(r: NextRequest) { return requireAdmin(r, handleGet); }
export async function POST(r: NextRequest) { return requireAdmin(r, handlePost); }
export async function PUT(r: NextRequest) { return requireAdmin(r, handlePut); }
export async function DELETE(r: NextRequest) { return requireAdmin(r, handleDelete); }
