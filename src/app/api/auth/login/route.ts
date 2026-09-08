import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signJwtToken } from '@/lib/auth';
import { FALLBACK_USERS } from '@/lib/fallback-data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Try Database Lookup
    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: { branch: true },
      });
    } catch (dbErr) {
      console.warn('Database query failed in login, checking fallback users:', dbErr);
    }

    // 2. Fallback User Authentication if DB was empty/unreachable
    if (!user) {
      const fallbackUser = FALLBACK_USERS.find((u) => u.email === cleanEmail);
      if (fallbackUser && fallbackUser.password === password) {
        user = {
          id: fallbackUser.id,
          name: fallbackUser.name,
          email: fallbackUser.email,
          role: fallbackUser.role,
          branch_id: fallbackUser.branch_id,
          branch: fallbackUser.branch,
          is_active: true,
        };
      }
    } else {
      // Compare password hash for DB users
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }
    }

    if (!user || !user.is_active) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = signJwtToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'employee' | 'admin',
      branch_id: user.branch_id,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch_id: user.branch_id,
        branch: user.branch ? { id: user.branch.id, name: user.branch.name } : null,
      },
    });

    // Set httpOnly cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error during login' },
      { status: 500 }
    );
  }
}
