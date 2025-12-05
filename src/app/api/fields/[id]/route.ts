import { NextResponse } from 'next/server';
import { SAMPLE_FIELDS } from '@/lib/utils/constants';

const fields = SAMPLE_FIELDS.map((field, index) => ({
  id: String(index + 1),
  ...field,
  images: field.images || [],
  created_at: new Date().toISOString(),
}));

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const field = fields.find(f => f.id === id);
    
    if (!field) {
      return NextResponse.json(
        { error: 'Terrain introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      field,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du terrain' },
      { status: 500 }
    );
  }
}

