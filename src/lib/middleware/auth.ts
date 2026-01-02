import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromCookies } from '@/lib/utils/jwt';
import { cookies } from 'next/headers';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware to verify JWT token from cookies
 * Returns user info if authenticated, null otherwise
 */
export async function verifyAuth(request: NextRequest): Promise<{
  user: { userId: string; email: string; role: string } | null;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = getTokenFromCookies(cookieStore);

    if (!token) {
      return { user: null, error: 'No token provided' };
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return { user: null, error: 'Invalid token' };
    }

    return {
      user: {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      },
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { user: null, error: 'Authentication failed' };
  }
}

/**
 * Middleware wrapper for protected routes
 * Returns 401 if not authenticated
 */
export async function requireAuth(
  request: NextRequest,
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const { user, error } = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { error: error || 'Authentication required' },
      { status: 401 }
    );
  }

  // Attach user to request
  (request as AuthenticatedRequest).user = user;

  return handler(request as AuthenticatedRequest);
}

/**
 * Middleware wrapper for admin-only routes
 * Returns 403 if not admin
 */
export async function requireAdmin(
  request: NextRequest,
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const { user, error } = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { error: error || 'Authentication required' },
      { status: 401 }
    );
  }

  if (user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  // Attach user to request
  (request as AuthenticatedRequest).user = user;

  return handler(request as AuthenticatedRequest);
}

