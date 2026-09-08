import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { seedDatabaseIfEmpty } from '@/lib/seed-data';
import { FALLBACK_BRANCHES } from '@/lib/fallback-data';

export async function GET() {
  try {
    let branches: any[] = [];
    try {
      branches = await prisma.branch.findMany({
        where: { is_active: true },
        include: {
          tables: {
            where: { is_active: true },
            select: { id: true, label: true },
          },
        },
        orderBy: { name: 'asc' },
      });

      // If database is empty, auto-seed
      if (branches.length === 0) {
        await seedDatabaseIfEmpty();
        branches = await prisma.branch.findMany({
          where: { is_active: true },
          include: {
            tables: {
              where: { is_active: true },
              select: { id: true, label: true },
            },
          },
          orderBy: { name: 'asc' },
        });
      }
    } catch (dbErr) {
      console.warn('Prisma branch query failed, using fallback branches:', dbErr);
    }

    if (!branches || branches.length === 0) {
      branches = FALLBACK_BRANCHES;
    }

    return NextResponse.json({ branches });
  } catch (error: any) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ branches: FALLBACK_BRANCHES });
  }
}
