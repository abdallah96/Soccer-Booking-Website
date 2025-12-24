import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

// GET all fields (admin view)
export async function GET() {
  try {
    const supabase = getAdminClient();

    // @ts-ignore - Supabase types don't work well with service role client
    const { data: fields, error } = await supabase
      .from('fields')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fields fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch fields' },
        { status: 500 }
      );
    }

    return NextResponse.json({ fields: fields || [] });
  } catch (error) {
    console.error('Fields fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fields' },
      { status: 500 }
    );
  }
}

// POST create new field
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, location, price_per_hour, capacity, rating, facilities, images } = body;

    // Validation
    if (!name || !description || !location) {
      return NextResponse.json(
        { error: 'Nom, description et localisation sont requis' },
        { status: 400 }
      );
    }

    if (!price_per_hour || price_per_hour <= 0) {
      return NextResponse.json(
        { error: 'Le prix par heure doit être supérieur à 0' },
        { status: 400 }
      );
    }

    if (!capacity || capacity <= 0) {
      return NextResponse.json(
        { error: 'La capacité doit être supérieure à 0' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Check if field with same name already exists
    // @ts-ignore - Supabase types don't work well with service role client
    const { data: existingField } = await supabase
      .from('fields')
      .select('id')
      .eq('name', name)
      .single();

    if (existingField) {
      return NextResponse.json(
        { error: 'Un terrain avec ce nom existe déjà' },
        { status: 400 }
      );
    }

    // Create field
    // @ts-ignore - Supabase types don't work well with service role client
    const { data: field, error } = await supabase
      .from('fields')
      // @ts-ignore
      .insert({
        name,
        description,
        location,
        price_per_hour: Number(price_per_hour),
        capacity: Number(capacity),
        rating: rating ? Number(rating) : 0,
        facilities: facilities || [],
        images: images || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Field creation error:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la création du terrain' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      field,
      message: 'Terrain créé avec succès',
    });
  } catch (error) {
    console.error('Field creation error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du terrain' },
      { status: 500 }
    );
  }
}

