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
    const { name, unit, reorder_threshold } = await req.json();

    const updated = await prisma.inventoryItem.update({
      where: { id: params.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(unit ? { unit: unit.trim() } : {}),
        ...(reorder_threshold !== undefined ? { reorder_threshold: Number(reorder_threshold) } : {}),
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    await prisma.inventoryItem.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete inventory item' }, { status: 500 });
  }
}
