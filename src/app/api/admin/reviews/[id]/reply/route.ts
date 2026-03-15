import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';
import { sanitizeUUID, sanitizeString } from '@/lib/utils/sanitize';

async function handlePost(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;
    const { reply } = await request.json();

    if (!reply || reply.trim().length < 5) {
      return NextResponse.json(
        { error: 'La réponse doit contenir au moins 5 caractères' },
        { status: 400 }
      );
    }

    const sanitizedReviewId = sanitizeUUID(reviewId);
    if (!sanitizedReviewId) {
      return NextResponse.json(
        { error: 'ID de commentaire invalide' },
        { status: 400 }
      );
    }

    const sanitizedReply = sanitizeString(reply.trim());
    const adminId = request.user!.userId;

    const supabase = getAdminClient();

    // Check if review exists
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('id, field_id')
      .eq('id', sanitizedReviewId)
      .single();

    if (fetchError || !review) {
      return NextResponse.json(
        { error: 'Commentaire introuvable' },
        { status: 404 }
      );
    }

    // Update review with admin reply
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({
        admin_reply: sanitizedReply,
        admin_id: adminId,
        admin_replied_at: new Date().toISOString(),
      })
      .eq('id', sanitizedReviewId)
      .select(`
        *,
        admin:users!reviews_admin_id_fkey(id, name, email)
      `)
      .single();

    if (updateError) {
      console.error('Error updating review reply:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'ajout de la réponse' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      review: updatedReview,
      message: 'Réponse ajoutée avec succès',
    });
  } catch (error) {
    console.error('Error in POST /api/admin/reviews/[id]/reply:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

async function handlePut(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;
    const { reply } = await request.json();

    if (!reply || reply.trim().length < 5) {
      return NextResponse.json(
        { error: 'La réponse doit contenir au moins 5 caractères' },
        { status: 400 }
      );
    }

    const sanitizedReviewId = sanitizeUUID(reviewId);
    if (!sanitizedReviewId) {
      return NextResponse.json(
        { error: 'ID de commentaire invalide' },
        { status: 400 }
      );
    }

    const sanitizedReply = sanitizeString(reply.trim());

    const supabase = getAdminClient();

    // Update admin reply
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({
        admin_reply: sanitizedReply,
        admin_replied_at: new Date().toISOString(),
      })
      .eq('id', sanitizedReviewId)
      .select(`
        *,
        admin:users!reviews_admin_id_fkey(id, name, email)
      `)
      .single();

    if (updateError) {
      console.error('Error updating review reply:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la réponse' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      review: updatedReview,
      message: 'Réponse mise à jour avec succès',
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/reviews/[id]/reply:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

async function handleDelete(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;

    const sanitizedReviewId = sanitizeUUID(reviewId);
    if (!sanitizedReviewId) {
      return NextResponse.json(
        { error: 'ID de commentaire invalide' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Remove admin reply
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({
        admin_reply: null,
        admin_id: null,
        admin_replied_at: null,
      })
      .eq('id', sanitizedReviewId)
      .select()
      .single();

    if (updateError) {
      console.error('Error deleting review reply:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de la réponse' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Réponse supprimée avec succès',
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/reviews/[id]/reply:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  params: { params: Promise<{ id: string }> }
) {
  return requireAdmin(request, async (authRequest) => {
    return handlePost(authRequest, params);
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
