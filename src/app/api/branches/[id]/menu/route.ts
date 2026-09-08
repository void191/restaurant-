import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { FALLBACK_MENU_CATEGORIES } from '@/lib/fallback-data';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const branchId = params.id;

    let categories: any[] = [];
    try {
      categories = await prisma.menuCategory.findMany({
        orderBy: { sort_order: 'asc' },
        include: {
          menu_items: {
            where: { is_available: true },
            include: {
              modifiers: {
                orderBy: { is_required: 'desc' },
              },
              branch_menu_items: {
                where: { branch_id: branchId },
              },
            },
          },
        },
      });
    } catch (dbErr) {
      console.warn('DB menu query failed, using fallback menu:', dbErr);
    }

    if (!categories || categories.length === 0) {
      return NextResponse.json({ categories: FALLBACK_MENU_CATEGORIES });
    }

    // Filter out items that are marked unavailable for this specific branch
    const filteredCategories = categories
      .map((cat: any) => {
        const rawItems = cat.menu_items || cat.items || [];
        const availableItems = rawItems
          .filter((item: any) => {
            const branchOverride = item.branch_menu_items?.[0];
            if (branchOverride && !branchOverride.is_available) return false;
            return true;
          })
          .map((item: any) => {
            const branchOverride = item.branch_menu_items?.[0];
            return {
              ...item,
              stock_count: branchOverride?.stock_count ?? null,
            };
          });

        return {
          id: cat.id,
          name: cat.name,
          sort_order: cat.sort_order,
          items: availableItems,
        };
      })
      .filter((cat: any) => cat.items.length > 0);

    return NextResponse.json({
      categories: filteredCategories.length > 0 ? filteredCategories : FALLBACK_MENU_CATEGORIES,
    });
  } catch (error) {
    console.error('Error fetching branch menu:', error);
    return NextResponse.json({ categories: FALLBACK_MENU_CATEGORIES });
  }
}
