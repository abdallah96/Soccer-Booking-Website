import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { verifyAuth } from '@/lib/middleware/auth';
import { sanitizeUUID } from '@/lib/utils/sanitize';
import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11 },
  header: { marginBottom: 30, borderBottomWidth: 2, borderBottomColor: '#dc2626', paddingBottom: 15 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 12, color: '#6b7280' },
  receiptId: { fontSize: 9, color: '#9ca3af', marginTop: 6 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#dc2626', marginBottom: 8, textTransform: 'uppercase' as const },
  row: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  label: { color: '#6b7280', fontSize: 10, width: '40%' },
  value: { color: '#111827', fontWeight: 'bold', fontSize: 11, width: '60%', textAlign: 'right' as const },
  amountBox: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 8, padding: 15, marginTop: 10, alignItems: 'center' as const },
  amount: { fontSize: 24, fontWeight: 'bold', color: '#dc2626' },
  amountLabel: { fontSize: 10, color: '#9ca3af', marginTop: 4 },
  footer: { position: 'absolute' as const, bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 10 },
  footerText: { fontSize: 8, color: '#9ca3af', textAlign: 'center' as const },
});

function ReceiptDocument({ booking, field, user }: { booking: any; field: any; user: any }) {
  const dateStr = new Date(booking.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const amount = Number(booking.amount) || 0;

  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.title }, 'Petit Camp'),
        React.createElement(Text, { style: styles.subtitle }, 'Reçu de réservation'),
        React.createElement(Text, { style: styles.receiptId }, `N° ${booking.id.slice(0, 8).toUpperCase()}`)
      ),
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Client'),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Nom'),
          React.createElement(Text, { style: styles.value }, user?.name || 'N/A')
        ),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Téléphone'),
          React.createElement(Text, { style: styles.value }, user?.phone || 'N/A')
        ),
        user?.email ? React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Email'),
          React.createElement(Text, { style: styles.value }, user.email)
        ) : null
      ),
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Réservation'),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Terrain'),
          React.createElement(Text, { style: styles.value }, field?.name || 'Petit Camp')
        ),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Date'),
          React.createElement(Text, { style: styles.value }, dateStr)
        ),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Créneau'),
          React.createElement(Text, { style: styles.value }, booking.time_slot || 'N/A')
        ),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Statut'),
          React.createElement(Text, { style: styles.value },
            booking.status === 'confirmed' ? 'Confirmée' :
            booking.status === 'pending_payment' ? 'En attente de paiement' :
            booking.status === 'cancelled' ? 'Annulée' : booking.status
          )
        ),
        React.createElement(View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, 'Paiement'),
          React.createElement(Text, { style: styles.value },
            booking.payment_method === 'wave' ? 'Wave' :
            booking.payment_method === 'orange_money' ? 'Orange Money' :
            booking.payment_method === 'cash' ? 'Espèces' : booking.payment_method || 'N/A'
          )
        )
      ),
      React.createElement(View, { style: styles.amountBox },
        React.createElement(Text, { style: styles.amount }, `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`),
        React.createElement(Text, { style: styles.amountLabel }, 'Montant total')
      ),
      React.createElement(View, { style: styles.footer },
        React.createElement(Text, { style: styles.footerText }, `Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} — Petit Camp`)
      )
    )
  );
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sanitizedId = sanitizeUUID(id);
    if (!sanitizedId) {
      return NextResponse.json({ error: 'Invalid booking ID' }, { status: 400 });
    }

    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getAdminClient();
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*, field:fields(id, name, location), user:users(id, name, phone, email)')
      .eq('id', sanitizedId)
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (auth.role !== 'admin' && auth.role !== 'super_admin' && booking.user_id !== auth.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const doc = ReceiptDocument({ booking, field: booking.field, user: booking.user });
    const buffer = await renderToBuffer(doc as any);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="recu-${sanitizedId.slice(0, 8)}.pdf"`,
      },
    });
  } catch (err) {
    console.error('Receipt generation error:', err);
    return NextResponse.json({ error: 'Failed to generate receipt' }, { status: 500 });
  }
}
