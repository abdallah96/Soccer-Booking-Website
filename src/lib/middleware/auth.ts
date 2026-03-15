import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

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
    const supabase = getAdminClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    const { data: profile } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', user.id)
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
