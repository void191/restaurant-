import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { seedDatabaseIfEmpty } from '@/lib/seed-data';

export async function GET() {
  try {
    const result = await seedDatabaseIfEmpty();
    const branchCount = await prisma.branch.count();
    const itemCount = await prisma.menuItem.count();
    const userCount = await prisma.user.count();
    const orderCount = await prisma.order.count();

    return NextResponse.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      result,
      stats: {
        branches: branchCount,
        menu_items: itemCount,
        users: userCount,
        orders: orderCount,
      },
    });
  } catch (error: any) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      {
        success: false,
        status: 'error',
        error: error.message || 'Database connection error',
        hint: 'Ensure DATABASE_URL environment variable is set in Vercel / v0 project settings (e.g. Neon.tech, Supabase, or Vercel Postgres).',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
