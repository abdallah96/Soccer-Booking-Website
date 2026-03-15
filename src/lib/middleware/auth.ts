import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/utils/jwt';

export interface AuthUser {
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  name?: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser;
}

async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value ?? request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    if (!payload?.userId) return null;
    const supabase = getAdminClient();
    const { data: profile } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', payload.userId)
      .single();
    if (!profile) return null;
    return {
      userId: profile.id,
      email: profile.email,
      role: (profile.role as AuthUser['role']) || 'user',
      name: profile.name,
    };
  } catch {
    return null;
  }
}

export async function verifyAuth(request: NextRequest): Promise<{ user: AuthUser | null }> {
  const user = await getAuthUser(request);
  return { user };
}

export async function requireAuth<T>(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse<T>>
): Promise<NextResponse<T>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 }) as NextResponse<T>;
  }
  (request as AuthenticatedRequest).user = user;
  return handler(request as AuthenticatedRequest);
}

export async function requireAdmin<T>(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse<T>>
): Promise<NextResponse<T>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 }) as NextResponse<T>;
  }
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 }) as NextResponse<T>;
  }
  (request as AuthenticatedRequest).user = user;
  return handler(request as AuthenticatedRequest);
}

export async function requireSuperAdmin<T>(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse<T>>
): Promise<NextResponse<T>> {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 }) as NextResponse<T>;
  }
  if (user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Accès réservé au super administrateur' }, { status: 403 }) as NextResponse<T>;
  }
  (request as AuthenticatedRequest).user = user;
  return handler(request as AuthenticatedRequest);
}
