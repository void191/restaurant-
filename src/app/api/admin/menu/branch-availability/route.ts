import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRoute } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    const { branch_id, menu_item_id, is_available, stock_count } = await req.json();

    if (!branch_id || !menu_item_id) {
      return NextResponse.json(
        { error: 'branch_id and menu_item_id are required' },
        { status: 400 }
      );
    }

    const updated = await prisma.branchMenuItem.upsert({
      where: {
        branch_id_menu_item_id: {
          branch_id,
          menu_item_id,
        },
      },
      update: {
        ...(is_available !== undefined ? { is_available: Boolean(is_available) } : {}),
        ...(stock_count !== undefined ? { stock_count: stock_count === null || stock_count === '' ? null : Number(stock_count) } : {}),
      },
      create: {
        branch_id,
        menu_item_id,
        is_available: is_available !== undefined ? Boolean(is_available) : true,
        stock_count: stock_count !== undefined && stock_count !== null && stock_count !== '' ? Number(stock_count) : null,
      },
    });

    return NextResponse.json({ success: true, branch_menu_item: updated });
  } catch (error) {
    console.error('Error updating branch menu availability:', error);
    return NextResponse.json({ error: 'Failed to update branch item override' }, { status: 500 });
  }
}
