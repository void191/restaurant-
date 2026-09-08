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
    const item = await prisma.menuItem.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        modifiers: true,
        branch_menu_items: {
          include: { branch: true },
        },
      },
    });

    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    const { category_id, name, description, price, image_url, is_available, modifiers } = await req.json();

    const updated = await prisma.menuItem.update({
      where: { id: params.id },
      data: {
        ...(category_id ? { category_id } : {}),
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(description !== undefined ? { description: description.trim() } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(image_url !== undefined ? { image_url: image_url.trim() } : {}),
        ...(is_available !== undefined ? { is_available: Boolean(is_available) } : {}),
      },
      include: {
        category: true,
        modifiers: true,
      },
    });

    // If modifiers list provided, replace modifiers
    if (Array.isArray(modifiers)) {
      await prisma.modifier.deleteMany({
        where: { menu_item_id: params.id },
      });
      if (modifiers.length > 0) {
        await prisma.modifier.createMany({
          data: modifiers.map((m: any) => ({
            menu_item_id: params.id,
            name: m.name,
            price_delta: Number(m.price_delta || 0),
            is_required: Boolean(m.is_required),
            group_name: m.group_name || 'General',
          })),
        });
      }
    }

    const refreshed = await prisma.menuItem.findUnique({
      where: { id: params.id },
      include: { category: true, modifiers: true },
    });

    return NextResponse.json({ success: true, item: refreshed });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    await prisma.menuItem.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
