import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { Field } from '@/types';

// GET single field
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getAdminClient();

    // @ts-ignore - Supabase types don't work well with service role client
    const { data: field, error } = await supabase
      .from('fields')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !field) {
      return NextResponse.json(
        { error: 'Terrain introuvable' },
        { status: 404 }
      );
    }

    return NextResponse.json({ field });
  } catch (error) {
    console.error('Field fetch error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du terrain' },
      { status: 500 }
    );
  }
}

// PUT update field
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, location, price_per_hour, capacity, rating, facilities, images } = body;

    // Validation
    if (!name || !description || !location) {
      return NextResponse.json(
        { error: 'Nom, description et localisation sont requis' },
        { status: 400 }
      );
    }

    if (price_per_hour !== undefined && price_per_hour <= 0) {
      return NextResponse.json(
        { error: 'Le prix par heure doit être supérieur à 0' },
        { status: 400 }
      );
    }

    if (capacity !== undefined && capacity <= 0) {
      return NextResponse.json(
        { error: 'La capacité doit être supérieure à 0' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Check if field exists
    // @ts-ignore - Supabase types don't work well with service role client
    const { data: existingFieldData, error: fetchError } = await supabase
      .from('fields')
      .select('id, name')
      .eq('id', id)
      .single();

    if (fetchError || !existingFieldData) {
      return NextResponse.json(
        { error: 'Terrain introuvable' },
        { status: 404 }
      );
    }

    const existingField = existingFieldData as { id: string; name: string };

    // Check if another field with same name exists (excluding current field)
    if (name !== existingField.name) {
      // @ts-ignore - Supabase types don't work well with service role client
      const { data: duplicateField } = await supabase
        .from('fields')
        .select('id')
        .eq('name', name)
        .neq('id', id)
        .single();

      if (duplicateField) {
        return NextResponse.json(
          { error: 'Un terrain avec ce nom existe déjà' },
          { status: 400 }
        );
      }
    }

    // Update field
    const updateData: any = {
      name,
      description,
      location,
      updated_at: new Date().toISOString(),
    };

    if (price_per_hour !== undefined) {
      updateData.price_per_hour = Number(price_per_hour);
    }
    if (capacity !== undefined) {
      updateData.capacity = Number(capacity);
    }
    if (rating !== undefined) {
      updateData.rating = Number(rating);
    }
    if (facilities !== undefined) {
      updateData.facilities = facilities;
    }
    if (images !== undefined) {
      updateData.images = images;
    }

    // @ts-ignore - Supabase types don't work well with service role client
    const { data: field, error } = await supabase
      .from('fields')
      // @ts-ignore
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Field update error:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du terrain' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      field,
      message: 'Terrain mis à jour avec succès',
    });
  } catch (error) {
    console.error('Field update error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du terrain' },
      { status: 500 }
    );
  }
}

// DELETE field
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getAdminClient();

    // Check if field exists
    // @ts-ignore - Supabase types don't work well with service role client
    const { data: existingField } = await supabase
      .from('fields')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingField) {
      return NextResponse.json(
        { error: 'Terrain introuvable' },
        { status: 404 }
      );
    }

    // Check if field has bookings
    // @ts-ignore - Supabase types don't work well with service role client
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('field_id', id)
      .limit(1);

    if (bookings && bookings.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un terrain avec des réservations' },
        { status: 400 }
      );
    }

    // Delete field
    // @ts-ignore - Supabase types don't work well with service role client
    const { error } = await supabase
      .from('fields')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Field deletion error:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression du terrain' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Terrain supprimé avec succès',
    });
  } catch (error) {
    console.error('Field deletion error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du terrain' },
      { status: 500 }
    );
  }
}

