import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';
import { sanitizeString, sanitizeNumber } from '@/lib/utils/sanitize';

// GET all fields (admin view)
async function handleGet(request: AuthenticatedRequest) {
  try {
    const supabase = getAdminClient();

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
async function handlePost(request: AuthenticatedRequest) {
  try {
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

    const sanitizedPrice = sanitizeNumber(price_per_hour, 1);
    if (!sanitizedPrice || sanitizedPrice <= 0) {
      return NextResponse.json(
        { error: 'Le prix par heure doit être supérieur à 0' },
        { status: 400 }
      );
    }

    const sanitizedCapacity = sanitizeNumber(capacity, 1);
    if (!sanitizedCapacity || sanitizedCapacity <= 0) {
      return NextResponse.json(
        { error: 'La capacité doit être supérieure à 0' },
        { status: 400 }
      );
    }

    const sanitizedRating = rating ? sanitizeNumber(rating, 0, 5) : 0;

    // Validate facilities and images are arrays
    const sanitizedFacilities = Array.isArray(facilities) 
      ? facilities.map(f => sanitizeString(String(f))).filter(Boolean)
      : [];
    const sanitizedImages = Array.isArray(images)
      ? images.map(img => String(img).trim()).filter(Boolean).slice(0, 10) // Max 10 images
      : [];

    const supabase = getAdminClient();

    // Check if field with same name already exists
    const { data: existingField } = await supabase
      .from('fields')
      .select('id')
      .eq('name', sanitizedName)
      .single();

    if (existingField) {
      return NextResponse.json(
        { error: 'Un terrain avec ce nom existe déjà' },
        { status: 400 }
      );
    }

    // Create field
    const { data: field, error } = await supabase
      .from('fields')
      // @ts-ignore
      .insert({
        name: sanitizedName,
        description: sanitizedDescription,
        location: sanitizedLocation,
        price_per_hour: sanitizedPrice,
        capacity: sanitizedCapacity,
        rating: sanitizedRating,
        facilities: sanitizedFacilities,
        images: sanitizedImages,
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

export async function GET(request: NextRequest) {
  return requireAdmin(request, handleGet);
}

export async function POST(request: NextRequest) {
  return requireAdmin(request, handlePost);
}

