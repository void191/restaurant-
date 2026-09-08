import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRoute } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    const items = await prisma.menuItem.findMany({
      include: {
        category: true,
        modifiers: true,
        branch_menu_items: {
          include: { branch: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    const { category_id, name, description, price, image_url, modifiers } = await req.json();

    if (!category_id || !name || !description || price === undefined || !image_url) {
      return NextResponse.json(
        { error: 'Missing required menu item fields' },
        { status: 400 }
      );
    }

    // 1. Create Menu Item & Modifiers
    const newItem = await prisma.menuItem.create({
      data: {
        category_id,
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        image_url: image_url.trim(),
        is_available: true,
        modifiers: {
          create: (modifiers || []).map((m: any) => ({
            name: m.name,
            price_delta: Number(m.price_delta || 0),
            is_required: Boolean(m.is_required),
            group_name: m.group_name || 'General',
          })),
        },
      },
      include: {
        category: true,
        modifiers: true,
      },
    });

    // 2. Automatically link to all active branches via BranchMenuItem (Section 4)
    const branches = await prisma.branch.findMany({ where: { is_active: true } });
    for (const b of branches) {
      await prisma.branchMenuItem.create({
        data: {
          branch_id: b.id,
          menu_item_id: newItem.id,
          is_available: true,
          stock_count: null,
        },
      });
    }

    return NextResponse.json({ success: true, item: newItem });
  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 });
  }
}
