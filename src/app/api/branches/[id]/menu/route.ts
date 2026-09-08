import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const branchId = params.id;

    // Check if branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { id: true, name: true, is_active: true },
    });

    if (!branch || !branch.is_active) {
      return NextResponse.json(
        { error: 'Branch not found or inactive' },
        { status: 404 }
      );
    }

    // Fetch categories with menu items and their branch overrides
    const categories = await prisma.menuCategory.findMany({
      orderBy: { sort_order: 'asc' },
      include: {
        menu_items: {
          where: { is_available: true },
          include: {
            modifiers: {
              orderBy: { name: 'asc' },
            },
            branch_menu_items: {
              where: { branch_id: branchId },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    // Filter items where branch override is available (or if no override exists, fallback to item availability)
    const formattedCategories = categories
      .map((cat) => {
        const availableItems = cat.menu_items
          .filter((item) => {
            const branchOverride = item.branch_menu_items[0];
            // If branch override exists, it must be is_available: true
            if (branchOverride) {
              return branchOverride.is_available;
            }
            return item.is_available;
          })
          .map((item) => {
            const branchOverride = item.branch_menu_items[0];
            return {
              id: item.id,
              category_id: item.category_id,
              name: item.name,
              description: item.description,
              price: item.price,
              image_url: item.image_url,
              stock_count: branchOverride ? branchOverride.stock_count : null,
              modifiers: item.modifiers,
            };
          });

        return {
          id: cat.id,
          name: cat.name,
          sort_order: cat.sort_order,
          items: availableItems,
        };
      })
      .filter((cat) => cat.items.length > 0);

    return NextResponse.json({
      branch: { id: branch.id, name: branch.name },
      categories: formattedCategories,
    });
  } catch (error) {
    console.error('Error fetching branch menu:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu for this branch' },
      { status: 500 }
    );
  }
}
