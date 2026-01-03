import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { verifyAuth } from '@/lib/middleware/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user } = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to edit reviews' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || !comment) {
      return NextResponse.json(
        { error: 'Rating and comment are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    if (comment.trim().length < 10) {
      return NextResponse.json(
        { error: 'Comment must be at least 10 characters long' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Get the review to check ownership
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('user_id, field_id')
      .eq('id', id)
      .single();

    if (fetchError || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Security: Only the review owner can edit
    if (review.user_id !== user.userId) {
      return NextResponse.json(
        { error: 'You can only edit your own reviews' },
        { status: 403 }
      );
    }

    // Update the review
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({
        rating,
        comment: comment.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        user:users(id, name, email)
      `)
      .single();

    if (updateError) {
      console.error('Error updating review:', updateError);
      return NextResponse.json(
        { error: 'Failed to update review' },
        { status: 500 }
      );
    }

    // Update field's average rating
    const { data: allReviewsData } = await supabase
      .from('reviews')
      .select('rating')
      .eq('field_id', review.field_id);

    const allReviews = allReviewsData as { rating: number }[] | null;

    if (allReviews && allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await supabase
        .from('fields')
        .update({ rating: Math.round(avgRating * 10) / 10 })
        .eq('id', review.field_id);
    }

    return NextResponse.json({ review: updatedReview });
  } catch (error) {
    console.error('Error in PUT /api/reviews/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

