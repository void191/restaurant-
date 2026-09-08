import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRoute } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    const { name, sort_order } = await req.json();
    const updated = await prisma.menuCategory.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(sort_order !== undefined ? { sort_order: Number(sort_order) } : {}),
      },
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    await prisma.menuCategory.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
