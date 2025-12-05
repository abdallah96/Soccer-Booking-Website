import { NextResponse } from 'next/server';
import { SAMPLE_FIELDS } from '@/lib/utils/constants';

const fields = SAMPLE_FIELDS.map((field, index) => ({
  id: String(index + 1),
  ...field,
  images: field.images || [],
  created_at: new Date().toISOString(),
}));

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { field_id, date, time_slot, payment_method } = body;

    if (!field_id || !date || !time_slot || !payment_method) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    const field = fields.find(f => f.id === field_id);
    if (!field) {
      return NextResponse.json(
        { error: 'Terrain introuvable' },
        { status: 404 }
      );
    }

    const booking = {
      id: String(Date.now()),
      user_id: 'current-user',
      field_id,
      date,
      time_slot,
      status: 'pending' as const,
      payment_method,
      amount: field.price_per_hour,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      booking,
      message: 'Réservation créée avec succès',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la création de la réservation' },
      { status: 500 }
    );
  }
}

