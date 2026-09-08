import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRoute } from '@/lib/auth';
import { notifyOrderStatusUpdated } from '@/lib/events';

const VALID_STATUSES = ['received', 'preparing', 'ready', 'completed', 'cancelled'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authorizeRoute(req, ['employee', 'admin']);
  if ('response' in authResult) {
    return authResult.response;
  }

  const { user } = authResult;
  const orderId = params.id;

  try {
    const body = await req.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Role-scoping: employee can ONLY update orders for their assigned branch
    if (user.role === 'employee') {
      if (existingOrder.branch_id !== user.branch_id) {
        return NextResponse.json(
          { error: 'Forbidden: You cannot update orders for other branches' },
          { status: 403 }
        );
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        branch: {
          select: { id: true, name: true, phone: true },
        },
        table: {
          select: { id: true, label: true },
        },
        order_items: {
          include: {
            menu_item: {
              select: { id: true, name: true, image_url: true },
            },
          },
        },
      },
    });

    // Notify real-time WebSocket listeners
    notifyOrderStatusUpdated(updatedOrder);

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
