import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'restaurant_ordering_system_jwt_secret_key_2026_super_secure';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: 'employee' | 'admin';
  branch_id?: string | null;
}

export function signJwtToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwtToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUserFromRequest(req?: NextRequest): Promise<TokenPayload | null> {
  let token: string | undefined;

  if (req) {
    // Check Authorization header first
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Check cookies
      token = req.cookies.get('auth_token')?.value;
    }
  } else {
    // Server component / action cookies
    try {
      const cookieStore = cookies();
      token = cookieStore.get('auth_token')?.value;
    } catch {
      // If called in a context where cookies() is not available
      return null;
    }
  }

  if (!token) return null;

  const payload = verifyJwtToken(token);
  if (!payload) return null;

  // Validate user is active in database
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, role: true, branch_id: true, is_active: true },
  });

  if (!user || !user.is_active) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as 'employee' | 'admin',
    branch_id: user.branch_id,
  };
}

export async function authorizeRoute(
  req: NextRequest,
  allowedRoles: ('employee' | 'admin')[]
): Promise<{ user: TokenPayload } | { response: NextResponse }> {
  const user = await getCurrentUserFromRequest(req);

  if (!user) {
    return {
      response: NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 }),
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      response: NextResponse.json(
        { error: 'Forbidden: You do not have permission to access this resource' },
        { status: 403 }
      ),
    };
  }

  return { user };
}
