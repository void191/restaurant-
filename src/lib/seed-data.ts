import prisma from './prisma';
import bcrypt from 'bcryptjs';

export async function seedDatabaseIfEmpty() {
  try {
    const branchCount = await prisma.branch.count();
    if (branchCount > 0) {
      console.log('> Database already populated with', branchCount, 'branches.');
      return { seeded: false, message: 'Database already has data.' };
    }

    console.log('> Database empty, auto-seeding initial data...');

    // 1. Create Branches
    const downtownBranch = await prisma.branch.create({
      data: {
        name: 'Downtown Flagship',
        address: '142 Market Street, Financial District',
        latitude: 37.7892,
        longitude: -122.4014,
        phone: '(415) 555-0142',
        opening_hours: {
          monday: '08:00 - 22:00',
          tuesday: '08:00 - 22:00',
          wednesday: '08:00 - 22:00',
          thursday: '08:00 - 23:00',
          friday: '08:00 - 00:00',
          saturday: '09:00 - 00:00',
          sunday: '09:00 - 21:00',
        },
        is_active: true,
      },
    });

    const uptownBranch = await prisma.branch.create({
      data: {
        name: 'Uptown Garden & Patio',
        address: '884 Columbus Avenue, North Beach',
        latitude: 37.8015,
        longitude: -122.4148,
        phone: '(415) 555-0884',
        opening_hours: {
          monday: '09:00 - 22:00',
          tuesday: '09:00 - 22:00',
          wednesday: '09:00 - 22:00',
          thursday: '09:00 - 22:00',
          friday: '09:00 - 23:30',
          saturday: '10:00 - 23:30',
          sunday: '10:00 - 21:00',
        },
        is_active: true,
      },
    });

    const marinaBranch = await prisma.branch.create({
      data: {
        name: 'Marina Waterfront',
        address: '2240 Chestnut Street, Marina',
        latitude: 37.7998,
        longitude: -122.4412,
        phone: '(415) 555-2240',
        opening_hours: {
          monday: '08:30 - 21:30',
          tuesday: '08:30 - 21:30',
          wednesday: '08:30 - 21:30',
          thursday: '08:30 - 22:00',
          friday: '08:30 - 23:00',
          saturday: '09:00 - 23:00',
          sunday: '09:00 - 21:00',
        },
        is_active: true,
      },
    });

    // 2. Create Tables
    const tableLabels = ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Patio 1', 'Patio 2', 'Bar 1', 'Bar 2'];
    const downtownTables = [];

    for (const label of tableLabels) {
      const t1 = await prisma.table.create({
        data: { branch_id: downtownBranch.id, label, is_active: true },
      });
      downtownTables.push(t1);

      await prisma.table.create({
        data: { branch_id: uptownBranch.id, label, is_active: true },
      });
      await prisma.table.create({
        data: { branch_id: marinaBranch.id, label, is_active: true },
      });
    }

    // 3. Create Users
    const passwordHash = await bcrypt.hash('password123', 10);
    const adminHash = await bcrypt.hash('admin123', 10);

    await prisma.user.create({
      data: {
        name: 'Elena Rostova (Admin)',
        email: 'admin@restaurant.com',
        password_hash: adminHash,
        role: 'admin',
        branch_id: null,
        is_active: true,
      },
    });

    await prisma.user.create({
      data: {
        name: 'Marcus Vance',
        email: 'downtown@restaurant.com',
        password_hash: passwordHash,
        role: 'employee',
        branch_id: downtownBranch.id,
        is_active: true,
      },
    });

    await prisma.user.create({
      data: {
        name: 'Sophia Lin',
        email: 'uptown@restaurant.com',
        password_hash: passwordHash,
        role: 'employee',
        branch_id: uptownBranch.id,
        is_active: true,
      },
    });

    // 4. Create Categories
    const catMains = await prisma.menuCategory.create({
      data: { name: 'Mains & Specialties', sort_order: 1 },
    });
    const catPizza = await prisma.menuCategory.create({
      data: { name: 'Wood-Fired Pizza', sort_order: 2 },
    });
    const catStarters = await prisma.menuCategory.create({
      data: { name: 'Starters & Salads', sort_order: 3 },
    });
    const catBeverages = await prisma.menuCategory.create({
      data: { name: 'Artisan Beverages', sort_order: 4 },
    });
    const catDesserts = await prisma.menuCategory.create({
      data: { name: 'House Desserts', sort_order: 5 },
    });

    // 5. Create Menu Items
    const menuItemsData = [
      {
        category_id: catMains.id,
        name: 'Truffle Butter Ribeye',
        description: 'Charred 12oz prime ribeye topped with compound black truffle butter, served with roasted rosemary fingerlings and blistered asparagus.',
        price: 36.0,
        image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        modifiers: [
          { name: 'Rare', price_delta: 0, group_name: 'Meat Temperature', is_required: true },
          { name: 'Medium Rare', price_delta: 0, group_name: 'Meat Temperature', is_required: true },
          { name: 'Medium', price_delta: 0, group_name: 'Meat Temperature', is_required: true },
          { name: 'Medium Well', price_delta: 0, group_name: 'Meat Temperature', is_required: true },
          { name: 'Extra Truffle Butter', price_delta: 3.5, group_name: 'Add-ons', is_required: false },
        ],
      },
      {
        category_id: catMains.id,
        name: 'Pan-Seared Pacific Salmon',
        description: 'Crispy skin wild-caught salmon over celery root puree, charred broccolini, and a lemon-caper beurre blanc.',
        price: 28.5,
        image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
        modifiers: [],
      },
      {
        category_id: catMains.id,
        name: 'Smoked Gouda Burger',
        description: 'Half-pound dry-aged beef patty, applewood bacon, melted smoked gouda, onion jam, and garlic aioli on a brioche bun.',
        price: 19.5,
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
        modifiers: [
          { name: 'Single Patty (8oz)', price_delta: 0, group_name: 'Size', is_required: true },
          { name: 'Double Patty (16oz)', price_delta: 5.5, group_name: 'Size', is_required: true },
          { name: 'Avocado Slices', price_delta: 2.5, group_name: 'Add-ons', is_required: false },
        ],
      },
      {
        category_id: catPizza.id,
        name: 'Margherita Burrata D.O.P.',
        description: 'San Marzano tomato sauce, fresh creamy burrata, sweet basil oil, and Maldon sea salt flakes.',
        price: 21.0,
        image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
        modifiers: [
          { name: 'Regular Crust (12")', price_delta: 0, group_name: 'Crust Size', is_required: true },
          { name: 'Large Family Crust (16")', price_delta: 6.0, group_name: 'Crust Size', is_required: true },
        ],
      },
      {
        category_id: catPizza.id,
        name: 'Wild Mushroom & Taleggio',
        description: 'Roasted cremini and shiitake mushrooms, melted taleggio cheese, thyme, white truffle oil on garlic cream base.',
        price: 23.5,
        image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
        modifiers: [],
      },
      {
        category_id: catStarters.id,
        name: 'Whipped Ricotta Crostini',
        description: 'House-whipped sheep milk ricotta, lavender wildflower honey, crushed pistachios on sourdough crostini.',
        price: 14.0,
        image_url: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80',
        modifiers: [],
      },
      {
        category_id: catBeverages.id,
        name: 'Smoked Blood Orange Spritz',
        description: 'Italian blood orange reduction, smoked rosemary syrup, prosecco, and sparkling mineral water.',
        price: 9.5,
        image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
        modifiers: [],
      },
      {
        category_id: catBeverages.id,
        name: 'Cold Brew Oat Latte',
        description: 'Single-origin Ethiopian cold brew coffee infused with creamy organic oat milk and vanilla bean syrup.',
        price: 6.5,
        image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
        modifiers: [],
      },
      {
        category_id: catDesserts.id,
        name: 'Pistachio Lava Cake',
        description: 'Warm Sicilian pistachio cake with a molten white chocolate core, served with salted caramel gelato.',
        price: 13.0,
        image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
        modifiers: [],
      },
      {
        category_id: catDesserts.id,
        name: 'Traditional Tiramisu Classico',
        description: 'Espresso-soaked savoiardi ladyfingers layered with rich mascarpone zabaglione and Valrhona cocoa.',
        price: 11.5,
        image_url: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
        modifiers: [],
      },
    ];

    const branches = [downtownBranch, uptownBranch, marinaBranch];
    const createdMenuItems = [];

    for (const itemData of menuItemsData) {
      const { modifiers, ...itemDetails } = itemData;
      const menuItem = await prisma.menuItem.create({
        data: {
          ...itemDetails,
          is_available: true,
        },
      });
      createdMenuItems.push(menuItem);

      if (modifiers && modifiers.length > 0) {
        for (const mod of modifiers) {
          await prisma.modifier.create({
            data: {
              menu_item_id: menuItem.id,
              name: mod.name,
              price_delta: mod.price_delta,
              is_required: mod.is_required,
              group_name: mod.group_name,
            },
          });
        }
      }

      for (const branch of branches) {
        await prisma.branchMenuItem.create({
          data: {
            branch_id: branch.id,
            menu_item_id: menuItem.id,
            is_available: true,
            stock_count: null,
          },
        });
      }
    }

    // 6. Create Seed Orders for Live Ticket Rail
    await prisma.order.create({
      data: {
        branch_id: downtownBranch.id,
        order_type: 'dine_in_table',
        table_id: downtownTables[3].id, // Table 4
        customer_name: 'Arthur Pendelton',
        customer_phone: '(415) 555-8921',
        status: 'received',
        subtotal: 57.0,
        total: 57.0,
        order_items: {
          create: [
            {
              menu_item_id: createdMenuItems[0].id,
              quantity: 1,
              unit_price: 36.0,
              selected_modifiers: [{ name: 'Medium Rare', price_delta: 0, group_name: 'Meat Temperature' }],
              notes: 'Medium rare please',
            },
            {
              menu_item_id: createdMenuItems[3].id,
              quantity: 1,
              unit_price: 21.0,
              selected_modifiers: [],
              notes: null,
            },
          ],
        },
      },
    });

    await prisma.order.create({
      data: {
        branch_id: downtownBranch.id,
        order_type: 'outdoor_gps',
        latitude: 37.7892,
        longitude: -122.4014,
        location_note: 'Market Street Entrance · Blue Subaru Outback with hazards',
        customer_name: 'Clara Oswald',
        customer_phone: '(415) 555-4301',
        status: 'preparing',
        subtotal: 33.5,
        total: 33.5,
        order_items: {
          create: [
            {
              menu_item_id: createdMenuItems[2].id,
              quantity: 1,
              unit_price: 19.5,
              selected_modifiers: [],
              notes: 'Extra napkins',
            },
            {
              menu_item_id: createdMenuItems[5].id,
              quantity: 1,
              unit_price: 14.0,
              selected_modifiers: [],
              notes: null,
            },
          ],
        },
      },
    });

    await prisma.order.create({
      data: {
        branch_id: downtownBranch.id,
        order_type: 'dine_in_table',
        table_id: downtownTables[6].id, // Patio 2
        customer_name: 'Damon Salvatore',
        status: 'ready',
        subtotal: 40.0,
        total: 40.0,
        order_items: {
          create: [
            {
              menu_item_id: createdMenuItems[1].id,
              quantity: 1,
              unit_price: 28.5,
              selected_modifiers: [],
              notes: null,
            },
            {
              menu_item_id: createdMenuItems[9].id,
              quantity: 1,
              unit_price: 11.5,
              selected_modifiers: [],
              notes: null,
            },
          ],
        },
      },
    });

    console.log('> Successfully seeded initial database records.');
    return { seeded: true, message: 'Database populated successfully.' };
  } catch (error: any) {
    console.error('Error during auto-seeding:', error);
    return { seeded: false, error: error.message };
  }
}
