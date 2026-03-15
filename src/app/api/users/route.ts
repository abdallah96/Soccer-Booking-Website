import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { verifyAuth } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const { user, error: authError } = await verifyAuth(request);
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Email or phone parameter is required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Search by phone first (primary identifier), then by email
    let userData = null;
    
    if (phone) {
      // Clean phone number for lookup (remove spaces, dashes)
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
      
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, phone')
        .or(`phone.eq.${phone},phone.eq.${cleanPhone}`)
        .limit(1)
        .single();
      
      if (!error && data) {
        userData = data;
      }
    }
    
    // Fallback to email search if no phone match
    if (!userData && email) {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, phone')
        .eq('email', email)
        .single();
      
      if (!error && data) {
        userData = data;
      }
    }

    if (!userData) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      );
    }

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Error in GET /api/users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

