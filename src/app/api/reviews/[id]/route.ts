import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { verifyAuth, requireAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      );
    }

    const { user, error: authError } = await verifyAuth(request);
    
    if (!user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: authError || 'Authentication required to edit reviews' },
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
      console.error('Error fetching review:', fetchError);
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Security: Only the review owner can edit (handle null user_id for anonymous reviews)
    if (!review.user_id) {
      return NextResponse.json(
        { error: 'Anonymous reviews cannot be edited' },
        { status: 403 }
      );
    }

    // Compare as strings to avoid type mismatch issues
    if (String(review.user_id) !== String(user.userId)) {
      return NextResponse.json(
        { error: 'You can only edit your own reviews' },
        { status: 403 }
      );
    }

    // Update the review
    const updateResult = await supabase
      .from('reviews')
      .update({
        rating,
        comment: comment.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateResult.error) {
      console.error('Error updating review:', updateResult.error);
      console.error('Review ID:', id);
      console.error('User ID:', user.userId);
      console.error('Update data:', { rating, comment: comment.trim() });
      return NextResponse.json(
        { error: 'Failed to update review', details: updateResult.error.message },
        { status: 500 }
      );
    }

    if (!updateResult.data) {
      console.error('Review update returned no data');
      return NextResponse.json(
        { error: 'Review update failed - no data returned' },
        { status: 500 }
      );
    }

    // Fetch user info separately to avoid join issues
    const reviewData = updateResult.data as { user_id: string; [key: string]: any };
    let userData = null;
    
    if (reviewData.user_id) {
      const { data, error: userError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', reviewData.user_id)
        .single();
      
      if (!userError) {
        userData = data;
      } else {
        console.warn('Could not fetch user data:', userError);
      }
    }

    const updatedReview = {
      ...reviewData,
      user: userData || null,
    };

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
  } catch (error: any) {
    console.error('Error in PUT /api/reviews/[id]:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error message:', error?.message);
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleDelete(request: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      );
    }

    // Only admins can delete reviews
    if (request.user!.role !== 'admin' && request.user!.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Admin access required to delete reviews' },
        { status: 403 }
      );
    }

    const supabase = getAdminClient();

    // Get the review to check field_id for rating recalculation
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('field_id')
      .eq('id', id)
      .single();

    if (fetchError || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Delete the review
    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting review:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete review' },
        { status: 500 }
      );
    }

    // Recalculate field's average rating
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
    } else {
      // No reviews left, set rating to 0
      await supabase
        .from('fields')
        .update({ rating: 0 })
        .eq('id', review.field_id);
    }

    return NextResponse.json({ 
      message: 'Review deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/reviews/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  params: { params: Promise<{ id: string }> }
) {
  return requireAdmin(request, async (authRequest) => {
    return handleDelete(authRequest, params);
  });
}

