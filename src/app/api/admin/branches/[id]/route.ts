import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRoute } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    const branch = await prisma.branch.findUnique({
      where: { id: params.id },
      include: {
        tables: { orderBy: { label: 'asc' } },
        users: {
          select: { id: true, name: true, email: true, role: true, is_active: true },
        },
      },
    });

    if (!branch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    return NextResponse.json({ branch });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch branch' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    const { name, address, latitude, longitude, phone, opening_hours, is_active } = await req.json();

    const updated = await prisma.branch.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(address !== undefined ? { address: address.trim() } : {}),
        ...(latitude !== undefined ? { latitude: Number(latitude) } : {}),
        ...(longitude !== undefined ? { longitude: Number(longitude) } : {}),
        ...(phone !== undefined ? { phone: phone.trim() } : {}),
        ...(opening_hours !== undefined ? { opening_hours } : {}),
        ...(is_active !== undefined ? { is_active: Boolean(is_active) } : {}),
      },
      include: { tables: true },
    });

    return NextResponse.json({ success: true, branch: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update branch' }, { status: 500 });
  }
}
