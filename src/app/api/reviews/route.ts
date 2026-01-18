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

    // Get reviews with user info and admin reply info
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        user:users!reviews_user_id_fkey(id, name, email),
        admin:users!reviews_admin_id_fkey(id, name, email)
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
    
    // Map anonymous reviews to have user-like structure for frontend compatibility
    const reviews = (data || []).map((review: any) => {
      if (!review.user_id && review.reviewer_name) {
        return {
          ...review,
          user: {
            id: null,
            name: review.reviewer_name,
            email: review.reviewer_email || null,
          },
        };
      }
      return review;
    });

    // Calculate average rating
    const averageRating = reviews && reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length
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
    const body = await request.json();
    const { field_id, rating, comment, reviewer_name, reviewer_email } = body;

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
    
    // Try to verify auth (optional for anonymous reviews)
    const { user } = await verifyAuth(request);
    
    // Rate limiting for anonymous reviews (by IP)
    if (!user) {
      const clientIp = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
      
      // Check for recent anonymous reviews from same IP (max 1 per hour per field)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      const { data: recentReviews } = await supabase
        .from('reviews')
        .select('id, created_at')
        .eq('field_id', field_id)
        .is('user_id', null)
        .gte('created_at', oneHourAgo.toISOString());
      
      // Simple IP-based rate limiting (check if multiple reviews in last hour)
      // In production, you'd want to store IP addresses in a separate table
      if (recentReviews && recentReviews.length >= 2) {
        return NextResponse.json(
          { error: 'Trop de commentaires récents. Veuillez réessayer plus tard.' },
          { status: 429 }
        );
      }
      
      // Validate anonymous reviewer info
      if (!reviewer_name || reviewer_name.trim().length < 2) {
        return NextResponse.json(
          { error: 'Un nom est requis (minimum 2 caractères)' },
          { status: 400 }
        );
      }
    }

    // Check if authenticated user already reviewed this field
    if (user) {
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
    }

    // Create the review
    const reviewData: any = {
      field_id,
      rating,
      comment: comment.trim(),
    };
    
    if (user) {
      reviewData.user_id = user.userId;
    } else {
      // Anonymous review - store name and optional email
      reviewData.user_id = null;
      reviewData.reviewer_name = reviewer_name?.trim() || 'Anonyme';
      reviewData.reviewer_email = reviewer_email?.trim() || null;
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .insert(reviewData)
      .select(`
        *,
        user:users!reviews_user_id_fkey(id, name, email)
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

    // Return review with analytics data
    return NextResponse.json({ 
      review,
      analytics: {
        rating,
        is_anonymous: !user,
        total_reviews: (allReviews?.length || 0) + 1,
        average_rating: allReviews && allReviews.length > 0 
          ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) + rating) / (allReviews.length + 1) * 10) / 10
          : rating
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
