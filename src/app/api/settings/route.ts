import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

const PUBLIC_KEYS = [
  'cancellation_policy',
  'payment_instructions_wave',
  'payment_instructions_orange_money',
  'payment_whatsapp_number',
  'payment_timer_minutes',
  'acompte_percent',
];

const DEFAULTS: Record<string, string> = {
  cancellation_policy: 'Toute annulation doit être effectuée au moins 24h avant le créneau réservé.',
  payment_instructions_wave: 'Envoyez le montant sur Wave au numéro : +221 78 925 18 34 (Petit Camp). Indiquez votre nom et la date de votre réservation en message.',
  payment_instructions_orange_money: 'Envoyez le montant sur Orange Money au numéro : +221 78 925 18 34 (Petit Camp). Indiquez votre nom et la date de votre réservation en message.',
  payment_whatsapp_number: '+221789251834',
  payment_timer_minutes: '30',
  acompte_percent: '50',
};

export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const { data } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', PUBLIC_KEYS);

    const settings = { ...DEFAULTS };
    (data || []).forEach((row: { key: string; value: string }) => {
      settings[row.key] = row.value;
    });

    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ settings: DEFAULTS });
  }
}
