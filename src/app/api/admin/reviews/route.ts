import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';

async function handleGet(request: AuthenticatedRequest) {
  try {
    const supabase = getAdminClient();
    const { searchParams } = new URL(request.url);
    const fieldId = searchParams.get('field_id');

    let query = supabase
      .from('reviews')
      .select(`
        *,
        user:users!reviews_user_id_fkey(id, name, email, phone),
        admin:users!reviews_admin_id_fkey(id, name, email),
        field:fields(id, name)
      `)
      .order('created_at', { ascending: false });

    // Filter by field if specified
    if (fieldId) {
      query = query.eq('field_id', fieldId);
    }

    const { data: reviews, error } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      reviews: reviews || [],
      total: (reviews || []).length,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return requireAdmin(request, handleGet);
}
