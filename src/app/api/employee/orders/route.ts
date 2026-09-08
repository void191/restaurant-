import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRoute } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authResult = await authorizeRoute(req, ['employee', 'admin']);
  if ('response' in authResult) {
    return authResult.response;
  }

  const { user } = authResult;
  const searchParams = req.nextUrl.searchParams;
  const statusFilter = searchParams.get('status'); // e.g. "active" or comma-separated

  try {
    let branchIdFilter: string | undefined = undefined;

    if (user.role === 'employee') {
      if (!user.branch_id) {
        return NextResponse.json(
          { error: 'Employee has no branch assigned' },
          { status: 403 }
        );
      }
      branchIdFilter = user.branch_id;
    } else if (user.role === 'admin') {
      const requestedBranch = searchParams.get('branch_id');
      if (requestedBranch && requestedBranch !== 'all') {
        branchIdFilter = requestedBranch;
      }
    }

    // Default to active ticket-rail statuses: received, preparing, ready
    let statusCondition: any = {
      in: ['received', 'preparing', 'ready'],
    };

    if (statusFilter && statusFilter !== 'active') {
      statusCondition = { in: statusFilter.split(',') };
    }

    const orders = await prisma.order.findMany({
      where: {
        ...(branchIdFilter ? { branch_id: branchIdFilter } : {}),
        status: statusCondition,
      },
      include: {
        branch: {
          select: { id: true, name: true },
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
      orderBy: { created_at: 'asc' }, // FIFO queue for kitchen
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching employee live orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live orders' },
      { status: 500 }
    );
  }
}
