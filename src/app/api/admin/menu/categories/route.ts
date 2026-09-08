import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRoute } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    const categories = await prisma.menuCategory.findMany({
      orderBy: { sort_order: 'asc' },
      include: {
        _count: { select: { menu_items: true } },
      },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    const { name, sort_order } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const category = await prisma.menuCategory.create({
      data: {
        name: name.trim(),
        sort_order: typeof sort_order === 'number' ? sort_order : 0,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
