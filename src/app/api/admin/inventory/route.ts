import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRoute } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  const branchId = req.nextUrl.searchParams.get('branch_id');

  try {
    const items = await prisma.inventoryItem.findMany({
      where: branchId && branchId !== 'all' ? { branch_id: branchId } : {},
      include: {
        branch: { select: { id: true, name: true } },
        transactions: {
          orderBy: { created_at: 'desc' },
          take: 5,
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ inventory: items });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    const { branch_id, name, unit, quantity_on_hand, reorder_threshold } = await req.json();

    if (!branch_id || !name || !unit || quantity_on_hand === undefined || reorder_threshold === undefined) {
      return NextResponse.json(
        { error: 'Missing required inventory item fields' },
        { status: 400 }
      );
    }

    const newItem = await prisma.inventoryItem.create({
      data: {
        branch_id,
        name: name.trim(),
        unit: unit.trim(),
        quantity_on_hand: Number(quantity_on_hand),
        reorder_threshold: Number(reorder_threshold),
        transactions: {
          create: {
            change_amount: Number(quantity_on_hand),
            reason: 'restock',
          },
        },
      },
      include: {
        branch: true,
        transactions: true,
      },
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}
