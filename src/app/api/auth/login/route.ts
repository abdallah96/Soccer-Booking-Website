import { NextRequest, NextResponse } from 'next/server';

// This is a mock implementation. In production, you would:
// 1. Query Supabase to verify the user
// 2. Generate a JWT token
// 3. Return user data and token

const mockUsers = [
  {
    id: '1',
    email: 'user@test.com',
    name: 'Test User',
    password: 'test123', // In production, this would be hashed
    role: 'user' as const,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'admin@sport.sn',
    name: 'Admin User',
    password: 'admin123',
    role: 'admin' as const,
    created_at: new Date().toISOString(),
  },
];

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Mock authentication - replace with Supabase in production
    const user = mockUsers.find(u => u.email === email);
    
    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // In production, generate a real JWT token
    const token = Buffer.from(JSON.stringify({ userId: user.id, email: user.email })).toString('base64');

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
