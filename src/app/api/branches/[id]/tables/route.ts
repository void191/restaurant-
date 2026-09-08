import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const branchId = params.id;

    const tables = await prisma.table.findMany({
      where: {
        branch_id: branchId,
        is_active: true,
      },
      orderBy: { label: 'asc' },
      select: {
        id: true,
        label: true,
        branch_id: true,
      },
    });

    return NextResponse.json({ tables });
  } catch (error) {
    console.error('Error fetching tables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branch tables' },
      { status: 500 }
    );
  }
}
