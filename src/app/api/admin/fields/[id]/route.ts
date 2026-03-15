import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { Field } from '@/types';
import { requireAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';
import { sanitizeUUID, sanitizeString, sanitizeNumber } from '@/lib/utils/sanitize';

// GET single field
async function handleGet(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getAdminClient();

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
async function handlePut(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sanitizedId = sanitizeUUID(id);
    if (!sanitizedId) {
      return NextResponse.json(
        { error: 'ID de terrain invalide' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, location, price_per_hour, capacity, rating, facilities, images } = body;

    // Validation and sanitization
    if (!name || !description || !location) {
      return NextResponse.json(
        { error: 'Nom, description et localisation sont requis' },
        { status: 400 }
      );
    }

    const sanitizedName = sanitizeString(name);
    const sanitizedDescription = sanitizeString(description);
    const sanitizedLocation = sanitizeString(location);

    if (sanitizedName.length < 2) {
      return NextResponse.json(
        { error: 'Le nom doit contenir au moins 2 caractères' },
        { status: 400 }
      );
    }

    const sanitizedPrice = price_per_hour !== undefined ? sanitizeNumber(price_per_hour, 1) : null;
    if (sanitizedPrice !== null && sanitizedPrice <= 0) {
      return NextResponse.json(
        { error: 'Le prix par heure doit être supérieur à 0' },
        { status: 400 }
      );
    }

    const sanitizedCapacity = capacity !== undefined ? sanitizeNumber(capacity, 1) : null;
    if (sanitizedCapacity !== null && sanitizedCapacity <= 0) {
      return NextResponse.json(
        { error: 'La capacité doit être supérieure à 0' },
        { status: 400 }
      );
    }

    const sanitizedRating = rating !== undefined ? sanitizeNumber(rating, 0, 5) : null;

    const supabase = getAdminClient();

    // Check if field exists
    const { data: existingFieldData, error: fetchError } = await supabase
      .from('fields')
      .select('id, name')
      .eq('id', sanitizedId)
      .single();

    if (fetchError || !existingFieldData) {
      return NextResponse.json(
        { error: 'Terrain introuvable' },
        { status: 404 }
      );
    }

    const existingField = existingFieldData as { id: string; name: string };

    // Check if another field with same name exists (excluding current field)
    if (sanitizedName !== existingField.name) {
      const { data: duplicateField } = await supabase
        .from('fields')
        .select('id')
        .eq('name', sanitizedName)
        .neq('id', sanitizedId)
        .single();

      if (duplicateField) {
        return NextResponse.json(
          { error: 'Un terrain avec ce nom existe déjà' },
          { status: 400 }
        );
      }
    }

    // Sanitize facilities and images
    const sanitizedFacilities = facilities !== undefined
      ? (Array.isArray(facilities) ? facilities.map(f => sanitizeString(String(f))).filter(Boolean) : [])
      : undefined;
    const sanitizedImages = images !== undefined
      ? (Array.isArray(images) ? images.map(img => String(img).trim()).filter(Boolean).slice(0, 10) : [])
      : undefined;

    // Update field
    const updateData: any = {
      name: sanitizedName,
      description: sanitizedDescription,
      location: sanitizedLocation,
      updated_at: new Date().toISOString(),
    };

    if (sanitizedPrice !== null) {
      updateData.price_per_hour = sanitizedPrice;
    }
    if (sanitizedCapacity !== null) {
      updateData.capacity = sanitizedCapacity;
    }
    if (sanitizedRating !== null) {
      updateData.rating = sanitizedRating;
    }
    if (sanitizedFacilities !== undefined) {
      updateData.facilities = sanitizedFacilities;
    }
    if (sanitizedImages !== undefined) {
      updateData.images = sanitizedImages;
    }

    const { data: field, error } = await supabase
      .from('fields')
      // @ts-ignore
      .update(updateData)
      .eq('id', sanitizedId)
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
async function handleDelete(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sanitizedId = sanitizeUUID(id);
    if (!sanitizedId) {
      return NextResponse.json(
        { error: 'ID de terrain invalide' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Check if field exists
    const { data: existingField } = await supabase
      .from('fields')
      .select('id')
      .eq('id', sanitizedId)
      .single();

    if (!existingField) {
      return NextResponse.json(
        { error: 'Terrain introuvable' },
        { status: 404 }
      );
    }

    // Check if field has bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .eq('field_id', sanitizedId)
      .limit(1);

    if (bookings && bookings.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un terrain avec des réservations' },
        { status: 400 }
      );
    }

    // Delete field
    const { error } = await supabase
      .from('fields')
      .delete()
      .eq('id', sanitizedId);

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

export async function GET(
  request: NextRequest,
  params: { params: Promise<{ id: string }> }
) {
  return requireAdmin(request, async (authRequest) => {
    return handleGet(authRequest, params);
  });
}

export async function PUT(
  request: NextRequest,
  params: { params: Promise<{ id: string }> }
) {
  return requireAdmin(request, async (authRequest) => {
    return handlePut(authRequest, params);
  });
}

export async function DELETE(
  request: NextRequest,
  params: { params: Promise<{ id: string }> }
) {
  return requireAdmin(request, async (authRequest) => {
    return handleDelete(authRequest, params);
  });
}

