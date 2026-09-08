import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { notifyNewOrder } from '@/lib/events';

interface OrderItemInput {
  menu_item_id: string;
  quantity: number;
  selected_modifiers?: Array<{
    name: string;
    price_delta: number;
    group_name: string;
  }>;
  notes?: string;
}

interface CreateOrderBody {
  branch_id: string;
  order_type: 'dine_in_table' | 'outdoor_gps' | 'pickup';
  table_id?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_note?: string | null;
  customer_name: string;
  customer_phone?: string | null;
  items: OrderItemInput[];
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrderBody = await req.json();

    const {
      branch_id,
      order_type,
      table_id,
      latitude,
      longitude,
      location_note,
      customer_name,
      customer_phone,
      items,
    } = body;

    // Validation
    if (!branch_id || !order_type || !customer_name || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required order fields (branch_id, order_type, customer_name, items)' },
        { status: 400 }
      );
    }

    if (!['dine_in_table', 'outdoor_gps', 'pickup'].includes(order_type)) {
      return NextResponse.json(
        { error: 'Invalid order_type. Must be dine_in_table, outdoor_gps, or pickup' },
        { status: 400 }
      );
    }

    if (order_type === 'dine_in_table' && !table_id) {
      return NextResponse.json(
        { error: 'table_id is required for dine_in_table orders' },
        { status: 400 }
      );
    }

    // Verify branch exists and is active
    const branch = await prisma.branch.findUnique({
      where: { id: branch_id },
    });

    if (!branch || !branch.is_active) {
      return NextResponse.json(
        { error: 'Branch is invalid or inactive' },
        { status: 400 }
      );
    }

    // Verify table if dine_in_table
    if (table_id) {
      const table = await prisma.table.findUnique({
        where: { id: table_id },
      });
      if (!table || table.branch_id !== branch_id || !table.is_active) {
        return NextResponse.json(
          { error: 'Selected table is invalid or not in this branch' },
          { status: 400 }
        );
      }
    }

    // Fetch menu items and verify availability/pricing
    const itemIds = items.map((i) => i.menu_item_id);
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: itemIds }, is_available: true },
      include: {
        modifiers: true,
        branch_menu_items: {
          where: { branch_id },
        },
      },
    });

    if (menuItems.length !== itemIds.length) {
      return NextResponse.json(
        { error: 'One or more menu items are invalid or unavailable' },
        { status: 400 }
      );
    }

    const menuItemMap = new Map(menuItems.map((m) => [m.id, m]));

    // Calculate subtotal and line items with validated server-side prices
    let subtotal = 0;
    const validatedOrderItems = [];

    for (const item of items) {
      const dbItem = menuItemMap.get(item.menu_item_id);
      if (!dbItem) continue;

      // Check branch availability override
      const branchOverride = dbItem.branch_menu_items[0];
      if (branchOverride && !branchOverride.is_available) {
        return NextResponse.json(
          { error: `Item "${dbItem.name}" is currently unavailable at this branch` },
          { status: 400 }
        );
      }

      // Calculate modifier price deltas
      let modifierTotal = 0;
      const validModifiers = (item.selected_modifiers || []).map((mod) => {
        // Find modifier in dbItem
        const dbMod = dbItem.modifiers.find((m) => m.name === mod.name && m.group_name === mod.group_name);
        const priceDelta = dbMod ? dbMod.price_delta : (mod.price_delta || 0);
        modifierTotal += priceDelta;
        return {
          name: mod.name,
          price_delta: priceDelta,
          group_name: mod.group_name,
        };
      });

      const unitPrice = dbItem.price + modifierTotal;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      validatedOrderItems.push({
        menu_item_id: dbItem.id,
        quantity: item.quantity,
        unit_price: unitPrice,
        selected_modifiers: validModifiers,
        notes: item.notes || null,
      });
    }

    const total = subtotal; // No hidden extra fees without tax spec, total = subtotal

    // Create Order and OrderItems in a transaction
    const newOrder = await prisma.order.create({
      data: {
        branch_id,
        order_type,
        table_id: order_type === 'dine_in_table' ? table_id : null,
        latitude: order_type === 'outdoor_gps' ? latitude : null,
        longitude: order_type === 'outdoor_gps' ? longitude : null,
        location_note: location_note || null,
        customer_name: customer_name.trim(),
        customer_phone: customer_phone ? customer_phone.trim() : null,
        status: 'received',
        subtotal,
        total,
        order_items: {
          create: validatedOrderItems,
        },
      },
      include: {
        branch: {
          select: { id: true, name: true, phone: true, address: true },
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
    });

    // Notify real-time WebSocket listeners
    notifyNewOrder(newOrder);

    return NextResponse.json({
      success: true,
      order: newOrder,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
