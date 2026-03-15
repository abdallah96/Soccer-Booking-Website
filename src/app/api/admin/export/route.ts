import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';

async function handleGet(request: AuthenticatedRequest) {
  try {
    const supabase = getAdminClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // optional filter
    const from = searchParams.get('from');     // optional date filter YYYY-MM-DD
    const to = searchParams.get('to');

    let query = supabase
      .from('bookings')
      .select(`
        id, date, time_slot, status, payment_method, payment_status,
        amount, created_at, cancelled_by, cancellation_reason,
        user:users(name, email, phone),
        field:fields(name, location)
      `)
      .order('date', { ascending: false });

    if (status) query = query.eq('status', status);
    if (from)   query = query.gte('date', from);
    if (to)     query = query.lte('date', to);

    const { data: bookings, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 });
    }

    // Build CSV
    const headers = [
      'ID', 'Terrain', 'Localisation', 'Date', 'Horaire',
      'Client', 'Email', 'Téléphone',
      'Montant (FCFA)', 'Paiement', 'Statut paiement', 'Statut réservation',
      'Annulé par', 'Motif annulation', 'Créé le'
    ];

    const escape = (v: any) => {
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
    };

    const rows = (bookings || []).map((b: any) => [
      b.id,
      b.field?.name || '',
      b.field?.location || '',
      b.date,
      b.time_slot,
      b.user?.name || '',
      b.user?.email || '',
      b.user?.phone || '',
      b.amount,
      b.payment_method === 'wave' ? 'Wave' : b.payment_method === 'orange_money' ? 'Orange Money' : 'Espèces',
      b.payment_status === 'paid' ? 'Payé' : b.payment_status === 'partial' ? 'Partiel' : 'Non payé',
      b.status === 'confirmed' ? 'Confirmée' : b.status === 'pending_payment' ? 'En attente paiement' : b.status === 'cancelled' ? 'Annulée' : 'En attente',
      b.cancelled_by || '',
      b.cancellation_reason || '',
      new Date(b.created_at).toLocaleDateString('fr-FR'),
    ].map(escape).join(','));

    const csv = [headers.join(','), ...rows].join('\n');
    const bom = '\uFEFF'; // UTF-8 BOM for Excel French locale

    const dateStr = new Date().toISOString().split('T')[0];
    return new NextResponse(bom + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="petit-camp-reservations-${dateStr}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Erreur export' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return requireAdmin(request, handleGet);
}
