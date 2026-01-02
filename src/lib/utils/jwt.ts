import { SignJWT, jwtVerify } from 'jose';

// JWT Secret - MUST be set in production
// Generate a secure random string: openssl rand -base64 32
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET || 'dev-secret-key-change-in-production';
const JWT_ALGORITHM = 'HS256';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  WARNING: JWT_SECRET not set! Using default secret. This is insecure for production!');
}

// Token expiration times
export const TOKEN_EXPIRATION = {
  ACCESS: '7d', // 7 days
  REFRESH: '30d', // 30 days
} as const;

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  [key: string]: string; // Index signature for JWTPayload compatibility
}

/**
 * Sign a JWT token
 */
export async function signToken(payload: TokenPayload, expiresIn: string = TOKEN_EXPIRATION.ACCESS): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);

  return token;
}

/**
 * Verify a JWT token
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [JWT_ALGORITHM],
    });

    return payload as TokenPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Get token from request cookies
 */
export function getTokenFromCookies(cookies: { get: (name: string) => { value: string } | undefined }): string | null {
  const tokenCookie = cookies.get('auth-token');
  return tokenCookie?.value || null;
}

