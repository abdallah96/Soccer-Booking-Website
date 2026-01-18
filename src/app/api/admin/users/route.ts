import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import bcrypt from 'bcryptjs';
import { requireAdmin, requireSuperAdmin, AuthenticatedRequest } from '@/lib/middleware/auth';
import { sanitizeEmail, sanitizeString } from '@/lib/utils/sanitize';

async function handleGet(request: AuthenticatedRequest) {
  try {
    const supabase = getAdminClient();
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role'); // Filter by role: 'admin', 'super_admin', etc.

    let query = supabase
      .from('users')
      .select('id, email, name, phone, role, created_at')
      .order('created_at', { ascending: false });

    // Filter by role if specified (for super_admin to see admins)
    if (roleFilter) {
      query = query.eq('role', roleFilter);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Users fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Get booking counts for each user
    const { data: bookingCounts, error: bookingError } = await supabase
      .from('bookings')
      .select('user_id, status');

    if (bookingError) {
      console.error('Booking counts fetch error:', bookingError);
    }

    // Calculate stats per user
    const userStats: Record<string, { total: number; confirmed: number; cancelled: number }> = {};
    (bookingCounts || []).forEach((booking: { user_id: string; status: string }) => {
      if (!userStats[booking.user_id]) {
        userStats[booking.user_id] = { total: 0, confirmed: 0, cancelled: 0 };
      }
      userStats[booking.user_id].total++;
      if (booking.status === 'confirmed') {
        userStats[booking.user_id].confirmed++;
      } else if (booking.status === 'cancelled') {
        userStats[booking.user_id].cancelled++;
      }
    });

    // Merge stats with users
    const usersWithStats = (users || []).map((user: any) => ({
      ...user,
      booking_stats: userStats[user.id] || { total: 0, confirmed: 0, cancelled: 0 },
    }));

    return NextResponse.json({ 
      users: usersWithStats,
      total: usersWithStats.length,
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

async function handlePost(request: AuthenticatedRequest) {
  try {
    // Only super_admin can create admins
    if (request.user!.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only Super Admin can create admins' },
        { status: 403 }
      );
    }

    const { email, password, name, role, phone } = await request.json();
    
    // Input validation and sanitization
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Super admin cannot create another super admin (safety measure)
    if (role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot create super admin through API. Use database directly.' },
        { status: 403 }
      );
    }

    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail || !sanitizedEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const sanitizedName = sanitizeString(name);
    if (sanitizedName.length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', sanitizedEmail)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: sanitizedEmail,
        name: sanitizedName,
        phone: phone ? sanitizeString(phone) : null,
        password_hash: hashedPassword,
        role: role || 'admin',
      })
      .select('id, email, name, phone, role, created_at')
      .single();

    if (error) {
      console.error('User creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

async function handleDelete(request: AuthenticatedRequest) {
  try {
    // Only super_admin can delete admins
    if (request.user!.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only Super Admin can delete admins' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent deleting yourself
    if (userId === request.user!.userId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Check if user is an admin or super_admin
    const { data: userToDelete, error: fetchError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (fetchError || !userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only allow deleting admins (not super_admin or regular users)
    if (userToDelete.role !== 'admin') {
      return NextResponse.json(
        { error: 'Can only delete admin accounts' },
        { status: 403 }
      );
    }

    // Delete the admin
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('User deletion error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete admin' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Admin deleted successfully',
    });
  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete admin' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return requireAdmin(request, handleGet);
}

export async function POST(request: NextRequest) {
  // Only super_admin can create admins
  return requireSuperAdmin(request, handlePost);
}

export async function DELETE(request: NextRequest) {
  // Only super_admin can delete admins
  return requireSuperAdmin(request, handleDelete);
}

