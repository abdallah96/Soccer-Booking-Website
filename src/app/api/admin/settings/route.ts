import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';

// Default settings used if none are stored yet
const DEFAULT_SETTINGS = {
  cancellation_policy: 'Toute annulation doit être effectuée au moins 24h avant le créneau réservé. Passé ce délai, aucun remboursement ne sera possible. En cas de retard de paiement supérieur à 30 minutes, la réservation sera automatiquement annulée.',
  payment_instructions_wave: 'Envoyez le montant sur Wave au numéro : +221 78 925 18 34 (Petit Camp). Indiquez votre nom et la date de votre réservation en message.',
  payment_instructions_orange_money: 'Envoyez le montant sur Orange Money au numéro : +221 78 925 18 34 (Petit Camp). Indiquez votre nom et la date de votre réservation en message.',
  payment_whatsapp_number: '+221789251834',
  payment_timer_minutes: 30,
  acompte_percent: 50,
};

async function handleGet(request: AuthenticatedRequest) {
  try {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', Object.keys(DEFAULT_SETTINGS));

    if (error) {
      // Table might not exist yet — return defaults
      return NextResponse.json({ settings: DEFAULT_SETTINGS });
    }

    // Merge DB values over defaults
    const settings = { ...DEFAULT_SETTINGS };
    (data || []).forEach((row: { key: string; value: string }) => {
      (settings as any)[row.key] = row.value;
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ settings: DEFAULT_SETTINGS });
  }
}

async function handlePost(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const supabase = getAdminClient();

    const updates = Object.entries(body).map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('app_settings')
      .upsert(updates, { onConflict: 'key' });

    if (error) {
      console.error('Settings update error:', error);
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Paramètres sauvegardés', settings: body });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return requireAdmin(request, handleGet);
}

export async function POST(request: NextRequest) {
  return requireAdmin(request, handlePost);
}
