import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PETIT_CAMP_FIELD } from '@/lib/utils/constants';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Try to fetch from database
    const { data: dbField, error } = await supabase
      .from('fields')
      .select('*')
      .eq('id', id)
      .single();

    if (dbField) {
      return NextResponse.json({
        field: {
          ...dbField,
          images: dbField.images || [],
        }
      });
    }

    // Fallback to constant if id matches Petit Camp
    if (id === 'petit-camp-1' || id === PETIT_CAMP_FIELD.id) {
      return NextResponse.json({
        field: {
          ...PETIT_CAMP_FIELD,
          created_at: new Date().toISOString(),
        }
      });
    }
    
    return NextResponse.json(
      { error: 'Terrain introuvable' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Field fetch error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du terrain' },
      { status: 500 }
    );
  }
}

