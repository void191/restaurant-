import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRoute } from '@/lib/auth';

const VALID_REASONS = ['restock', 'order_deduction', 'waste', 'manual_adjustment'];

export async function POST(req: NextRequest) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    const { inventory_item_id, change_amount, reason } = await req.json();

    if (!inventory_item_id || change_amount === undefined || !reason) {
      return NextResponse.json(
        { error: 'inventory_item_id, change_amount, and reason are required' },
        { status: 400 }
      );
    }

    if (!VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: `Invalid reason. Must be one of: ${VALID_REASONS.join(', ')}` },
        { status: 400 }
      );
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id: inventory_item_id },
    });

    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    const delta = Number(change_amount);
    const newQuantity = Math.max(0, item.quantity_on_hand + delta);

    const [transaction, updatedItem] = await prisma.$transaction([
      prisma.inventoryTransaction.create({
        data: {
          inventory_item_id,
          change_amount: delta,
          reason,
        },
      }),
      prisma.inventoryItem.update({
        where: { id: inventory_item_id },
        data: {
          quantity_on_hand: newQuantity,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      transaction,
      item: updatedItem,
    });
  } catch (error) {
    console.error('Error recording inventory transaction:', error);
    return NextResponse.json({ error: 'Failed to record inventory adjustment' }, { status: 500 });
  }
}
