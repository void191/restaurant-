import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRoute } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  const searchParams = req.nextUrl.searchParams;
  const branchId = searchParams.get('branch_id');
  const status = searchParams.get('status');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const limit = Number(searchParams.get('limit') || '50');
  const page = Number(searchParams.get('page') || '1');

  try {
    const whereCondition: any = {};

    if (branchId && branchId !== 'all') {
      whereCondition.branch_id = branchId;
    }

    if (status && status !== 'all') {
      whereCondition.status = status;
    }

    if (startDate || endDate) {
      whereCondition.created_at = {};
      if (startDate) {
        whereCondition.created_at.gte = new Date(startDate);
      }
      if (endDate) {
        // Set to end of day if only date is passed
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereCondition.created_at.lte = end;
      }
    }

    // 1. Fetch Orders List with pagination
    const [totalOrdersCount, orders] = await Promise.all([
      prisma.order.count({ where: whereCondition }),
      prisma.order.findMany({
        where: whereCondition,
        include: {
          branch: { select: { id: true, name: true } },
          table: { select: { id: true, label: true } },
          order_items: {
            include: {
              menu_item: { select: { id: true, name: true } },
            },
          },
          payments: true,
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // 2. Aggregate Sales Analytics across matching criteria
    const allMatchingOrders = await prisma.order.findMany({
      where: whereCondition,
      select: {
        id: true,
        status: true,
        total: true,
        subtotal: true,
        order_type: true,
        payments: {
          select: { method: true, amount: true },
        },
      },
    });

    let totalRevenue = 0;
    const statusCounts: Record<string, number> = {
      received: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    };
    const orderTypeCounts: Record<string, number> = {
      dine_in_table: 0,
      outdoor_gps: 0,
      pickup: 0,
    };
    const paymentBreakdown: Record<string, { count: number; total: number }> = {
      cash: { count: 0, total: 0 },
      card: { count: 0, total: 0 },
      other: { count: 0, total: 0 },
    };

    for (const ord of allMatchingOrders) {
      if (ord.status !== 'cancelled') {
        totalRevenue += ord.total;
      }
      statusCounts[ord.status] = (statusCounts[ord.status] || 0) + 1;
      orderTypeCounts[ord.order_type] = (orderTypeCounts[ord.order_type] || 0) + 1;

      for (const p of ord.payments) {
        if (!paymentBreakdown[p.method]) {
          paymentBreakdown[p.method] = { count: 0, total: 0 };
        }
        paymentBreakdown[p.method].count += 1;
        paymentBreakdown[p.method].total += p.amount;
      }
    }

    const averageOrderValue =
      allMatchingOrders.length > 0 ? totalRevenue / allMatchingOrders.length : 0;

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalOrders: totalOrdersCount,
        averageOrderValue,
        statusCounts,
        orderTypeCounts,
        paymentBreakdown,
      },
      pagination: {
        total: totalOrdersCount,
        page,
        limit,
        pages: Math.ceil(totalOrdersCount / limit),
      },
      orders,
    });
  } catch (error) {
    console.error('Error fetching admin reports:', error);
    return NextResponse.json(
      { error: 'Failed to generate reports' },
      { status: 500 }
    );
  }
}
