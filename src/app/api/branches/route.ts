import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { seedDatabaseIfEmpty } from '@/lib/seed-data';

export async function GET() {
  try {
    let branches = await prisma.branch.findMany({
      where: { is_active: true },
      include: {
        tables: {
          where: { is_active: true },
          select: { id: true, label: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // If database is completely empty (e.g. fresh cloud deployment on v0/Vercel), auto-seed!
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

    return NextResponse.json({ branches });
  } catch (error: any) {
    console.error('Error fetching branches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branches', details: error.message },
      { status: 500 }
    );
  }
}
