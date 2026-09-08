import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeRoute } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    const branches = await prisma.branch.findMany({
      include: {
        tables: true,
        _count: {
          select: {
            users: true,
            orders: true,
            tables: true,
          },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    return NextResponse.json({ branches });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await authorizeRoute(req, ['admin']);
  if ('response' in authResult) return authResult.response;

  try {
    const { name, address, latitude, longitude, phone, opening_hours, tables } = await req.json();

    if (!name || !address || latitude === undefined || longitude === undefined || !phone) {
      return NextResponse.json(
        { error: 'Missing required branch fields (name, address, latitude, longitude, phone)' },
        { status: 400 }
      );
    }

    const defaultHours = opening_hours || {
      monday: '09:00 - 22:00',
      tuesday: '09:00 - 22:00',
      wednesday: '09:00 - 22:00',
      thursday: '09:00 - 22:00',
      friday: '09:00 - 23:00',
      saturday: '09:00 - 23:00',
      sunday: '09:00 - 21:00',
    };

    const newBranch = await prisma.branch.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        phone: phone.trim(),
        opening_hours: defaultHours,
        is_active: true,
      },
    });

    // Create initial tables if provided
    if (Array.isArray(tables) && tables.length > 0) {
      await prisma.table.createMany({
        data: tables.map((t: string | { label: string }) => ({
          branch_id: newBranch.id,
          label: typeof t === 'string' ? t : t.label,
          is_active: true,
        })),
      });
    } else {
      // Default standard tables
      const defaultTableLabels = ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Patio 1', 'Bar 1'];
      await prisma.table.createMany({
        data: defaultTableLabels.map((label) => ({
          branch_id: newBranch.id,
          label,
          is_active: true,
        })),
      });
    }

    // Automatically link all existing shared MenuItems to this new branch via BranchMenuItem
    const existingMenuItems = await prisma.menuItem.findMany({ select: { id: true } });
    if (existingMenuItems.length > 0) {
      await prisma.branchMenuItem.createMany({
        data: existingMenuItems.map((item) => ({
          branch_id: newBranch.id,
          menu_item_id: item.id,
          is_available: true,
          stock_count: null,
        })),
      });
    }

    const completeBranch = await prisma.branch.findUnique({
      where: { id: newBranch.id },
      include: { tables: true },
    });

    return NextResponse.json({ success: true, branch: completeBranch });
  } catch (error) {
    console.error('Error creating branch:', error);
    return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 });
  }
}
