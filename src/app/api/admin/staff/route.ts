import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { authorizeRoute } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branch_id: true,
        is_active: true,
        created_at: true,
        branch: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    const { name, email, password, role, branch_id } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    if (!['employee', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be employee or admin' },
        { status: 400 }
      );
    }

    if (role === 'employee' && !branch_id) {
      return NextResponse.json(
        { error: 'Employees must be assigned to a branch' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        role,
        branch_id: role === 'employee' ? branch_id : (branch_id || null),
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branch_id: true,
        is_active: true,
        created_at: true,
        branch: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Error creating staff account:', error);
    return NextResponse.json({ error: 'Failed to create staff account' }, { status: 500 });
  }
}
