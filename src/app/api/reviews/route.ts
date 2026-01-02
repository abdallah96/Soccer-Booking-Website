import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { verifyAuth } from '@/lib/middleware/auth';

interface ReviewWithUser {
  id: string;
  field_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user: { id: string; name: string; email: string } | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('field_id');

    if (!fieldId) {
      return NextResponse.json(
        { error: 'Field ID is required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Get reviews with user info
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        user:users(id, name, email)
      `)
      .eq('field_id', fieldId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    const reviews = data as unknown as ReviewWithUser[];

    // Calculate average rating
    const averageRating = reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return NextResponse.json({ 
      reviews: reviews || [], 
      averageRating: Math.round(averageRating * 10) / 10 
    });
  } catch (error) {
    console.error('Error in GET /api/reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { field_id, rating, comment } = body;

    if (!field_id || !rating || !comment) {
      return NextResponse.json(
        { error: 'Field ID, rating, and comment are required' },
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

    // Check if user already reviewed this field
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('field_id', field_id)
      .eq('user_id', user.userId)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'Vous avez déjà laissé un avis pour ce terrain' },
        { status: 400 }
      );
    }

    // Create the review
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        field_id,
        user_id: user.userId,
        rating,
        comment: comment.trim(),
      })
      .select(`
        *,
        user:users(id, name, email)
      `)
      .single();

    if (error) {
      console.error('Error creating review:', error);
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }

    // Update field's average rating
    const { data: allReviewsData } = await supabase
      .from('reviews')
      .select('rating')
      .eq('field_id', field_id);

    const allReviews = allReviewsData as { rating: number }[] | null;

    if (allReviews && allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await supabase
        .from('fields')
        .update({ rating: Math.round(avgRating * 10) / 10 })
        .eq('id', field_id);
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
