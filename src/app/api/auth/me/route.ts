import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const userPayload = await getCurrentUserFromRequest(req);

  if (!userPayload) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userPayload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      branch_id: true,
      branch: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
