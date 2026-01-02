import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { trackEventServer } from '@/lib/utils/analytics-server';
import { requireAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { sanitizeString, sanitizeEmail, sanitizePhone, sanitizeUUID } from '@/lib/utils/sanitize';

async function handlePut(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { name, email, phone } = await request.json();

    // Verify user can only update their own profile
    if (request.user!.userId !== userId) {
      return NextResponse.json(
        { error: 'Non autorisé à modifier ce profil' },
        { status: 403 }
      );
    }

    // Validation and sanitization
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Le nom et l\'email sont requis' },
        { status: 400 }
      );
    }

    const sanitizedName = sanitizeString(name);
    if (sanitizedName.length < 2) {
      return NextResponse.json(
        { error: 'Le nom doit contenir au moins 2 caractères' },
        { status: 400 }
      );
    }

    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail || !sanitizedEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      );
    }

    const sanitizedPhone = sanitizePhone(phone);
    const sanitizedUserId = sanitizeUUID(userId);
    if (!sanitizedUserId) {
      return NextResponse.json(
        { error: 'ID utilisateur invalide' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', sanitizedUserId)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    // Check if email is already taken by another user
    if (sanitizedEmail !== existingUser.email) {
      const { data: emailCheck } = await supabase
        .from('users')
        .select('id')
        .eq('email', sanitizedEmail)
        .neq('id', sanitizedUserId)
        .single();

      if (emailCheck) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé' },
          { status: 400 }
        );
      }
    }

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sanitizedUserId)
      .select()
      .single();

    if (updateError) {
      console.error('User update error:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour du profil' },
        { status: 500 }
      );
    }

    // Track profile update
    await trackEventServer(
      'user_action',
      'form_submitted',
      {
        user_id: sanitizedUserId,
        form_type: 'profile_update',
        updated_fields: { name: sanitizedName, email: sanitizedEmail, phone: sanitizedPhone },
      },
      sanitizedUserId
    );

    return NextResponse.json({
      user: updatedUser,
      message: 'Profil mis à jour avec succès',
    });
  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  params: { params: Promise<{ id: string }> }
) {
  return requireAuth(request, async (authRequest) => {
    return handlePut(authRequest, params);
  });
}

