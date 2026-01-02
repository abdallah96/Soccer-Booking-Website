import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import bcrypt from 'bcryptjs';
import { requireAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';
import { sanitizeUUID } from '@/lib/utils/sanitize';

async function handlePut(request: AuthenticatedRequest) {
  try {
    const { password, user_id } = await request.json();
    
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const sanitizedUserId = sanitizeUUID(user_id);
    if (!sanitizedUserId) {
      return NextResponse.json(
        { error: 'User ID is required and must be valid' },
        { status: 400 }
      );
    }

    // Verify user can only update their own password or is admin
    if (request.user!.userId !== sanitizedUserId && request.user!.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized to update this password' },
        { status: 403 }
      );
    }

    const supabase = getAdminClient();

    // Verify user exists
    // @ts-ignore - Supabase types don't work well with service role client
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', sanitizedUserId)
      .single();
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { error } = await supabase
      .from('users')
      // @ts-expect-error - Service role client types
      .update({ password_hash: hashedPassword })
      .eq('id', sanitizedUserId);

    if (error) {
      console.error('Password update error:', error);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return requireAdmin(request, handlePut);
}

