const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with comprehensive demo & live ticket data...');

  // Clean existing data in reverse relation order
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.modifier.deleteMany();
  await prisma.branchMenuItem.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.menuCategory.deleteMany();
  await prisma.table.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  console.log('Cleaned old records.');

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

  console.log('Created branches.');

  // 2. Create Tables for each branch
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
  console.log('Created tables.');

  // 3. Create Users (Admin & Branch Employees)
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Elena Rostova (Admin)',
      email: 'admin@restaurant.com',
      password_hash: adminHash,
      role: 'admin',
      branch_id: null,
      is_active: true,
    },
  });

  const employeeDowntown = await prisma.user.create({
    data: {
      name: 'Marcus Vance',
      email: 'downtown@restaurant.com',
      password_hash: passwordHash,
      role: 'employee',
      branch_id: downtownBranch.id,
      is_active: true,
    },
  });

  const employeeUptown = await prisma.user.create({
    data: {
      name: 'Sophia Lin',
      email: 'uptown@restaurant.com',
      password_hash: passwordHash,
      role: 'employee',
      branch_id: uptownBranch.id,
      is_active: true,
    },
  });

  console.log('Created users (admin & employees).');

  // 4. Create Menu Categories
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

  console.log('Created menu categories.');

  // 5. Create Menu Items and Modifiers
  const menuItemsData = [
    // Mains
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
        { name: 'Grilled Jumbo Prawns (3)', price_delta: 8.0, group_name: 'Add-ons', is_required: false },
      ],
    },
    {
      category_id: catMains.id,
      name: 'Pan-Seared Pacific Salmon',
      description: 'Crispy skin wild-caught salmon over celery root puree, charred broccolini, and a lemon-caper beurre blanc.',
      price: 28.5,
      image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
      modifiers: [
        { name: 'Gluten-Free Beurre Blanc', price_delta: 0, group_name: 'Dietary', is_required: false },
        { name: 'Extra Lemon Herb Crust', price_delta: 2.0, group_name: 'Add-ons', is_required: false },
      ],
    },
    {
      category_id: catMains.id,
      name: 'Smoked Gouda Burger',
      description: 'Half-pound dry-aged beef patty, applewood bacon, melted smoked gouda, onion jam, and garlic aioli on a toasted brioche bun.',
      price: 19.5,
      image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
      modifiers: [
        { name: 'Single Patty (8oz)', price_delta: 0, group_name: 'Size', is_required: true },
        { name: 'Double Patty (16oz)', price_delta: 5.5, group_name: 'Size', is_required: true },
        { name: 'Avocado Slices', price_delta: 2.5, group_name: 'Add-ons', is_required: false },
        { name: 'Fried Egg', price_delta: 2.0, group_name: 'Add-ons', is_required: false },
        { name: 'Gluten-Free Bun', price_delta: 2.0, group_name: 'Bun Option', is_required: false },
      ],
    },
    {
      category_id: catMains.id,
      name: 'Tuscan Braised Lamb Shank',
      description: 'Slow-cooked in Chianti wine and aromatic herbs for six hours, resting upon creamy saffron polenta.',
      price: 32.0,
      image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      modifiers: [
        { name: 'Extra Polenta', price_delta: 4.0, group_name: 'Sides', is_required: false },
      ],
    },

    // Wood-Fired Pizza
    {
      category_id: catPizza.id,
      name: 'Margherita Burrata D.O.P.',
      description: 'San Marzano tomato sauce, fresh creamy burrata, sweet basil oil, and Maldon sea salt flakes.',
      price: 21.0,
      image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80',
      modifiers: [
        { name: 'Regular Crust (12")', price_delta: 0, group_name: 'Crust Size', is_required: true },
        { name: 'Large Family Crust (16")', price_delta: 6.0, group_name: 'Crust Size', is_required: true },
        { name: 'Gluten-Free Cauliflower Crust', price_delta: 3.5, group_name: 'Crust Type', is_required: false },
        { name: 'Prosciutto di Parma (+)', price_delta: 4.5, group_name: 'Toppings', is_required: false },
        { name: 'Hot Honey Drizzle', price_delta: 1.5, group_name: 'Toppings', is_required: false },
      ],
    },
    {
      category_id: catPizza.id,
      name: 'Wild Mushroom & Taleggio',
      description: 'Roasted cremini and shiitake mushrooms, melted taleggio cheese, thyme, white truffle oil on garlic cream base.',
      price: 23.5,
      image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
      modifiers: [
        { name: 'Regular Crust (12")', price_delta: 0, group_name: 'Crust Size', is_required: true },
        { name: 'Large Family Crust (16")', price_delta: 6.0, group_name: 'Crust Size', is_required: true },
        { name: 'Extra Truffle Oil', price_delta: 2.0, group_name: 'Toppings', is_required: false },
      ],
    },
    {
      category_id: catPizza.id,
      name: 'Calabrian Spicy Pepperoni',
      description: 'Crispy cupping pepperoni, spicy Calabrian chili paste, fresh mozzarella, oregano, and hot clover honey.',
      price: 22.0,
      image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80',
      modifiers: [
        { name: 'Regular Crust (12")', price_delta: 0, group_name: 'Crust Size', is_required: true },
        { name: 'Large Family Crust (16")', price_delta: 6.0, group_name: 'Crust Size', is_required: true },
        { name: 'Double Pepperoni', price_delta: 3.0, group_name: 'Toppings', is_required: false },
        { name: 'Extra Chili Honey', price_delta: 1.5, group_name: 'Toppings', is_required: false },
      ],
    },

    // Starters
    {
      category_id: catStarters.id,
      name: 'Whipped Ricotta & Honey Crostini',
      description: 'House-whipped sheep milk ricotta, lavender wildflower honey, crushed pistachios on sourdough crostini.',
      price: 14.0,
      image_url: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=800&q=80',
      modifiers: [
        { name: 'Extra Crostini (4)', price_delta: 3.0, group_name: 'Portion', is_required: false },
      ],
    },
    {
      category_id: catStarters.id,
      name: 'Charred Spanish Octopus',
      description: 'Tender paprika-crusted octopus arm, fingerling potatoes, salsa verde, and pickled shallots.',
      price: 18.5,
      image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      modifiers: [],
    },
    {
      category_id: catStarters.id,
      name: 'Heirloom Tomato Caprese',
      description: 'Vine-ripened heirloom tomatoes, buffalo mozzarella, aged balsamic glaze, and fresh garden basil.',
      price: 15.0,
      image_url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22509?auto=format&fit=crop&w=800&q=80',
      modifiers: [],
    },

    // Beverages
    {
      category_id: catBeverages.id,
      name: 'Smoked Blood Orange Spritz',
      description: 'Italian blood orange reduction, smoked rosemary syrup, prosecco, and sparkling mineral water.',
      price: 9.5,
      image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
      modifiers: [
        { name: 'Mocktail (Alcohol-Free)', price_delta: -2.0, group_name: 'Style', is_required: true },
        { name: 'Full Spirit Signature Cocktail', price_delta: 0, group_name: 'Style', is_required: true },
      ],
    },
    {
      category_id: catBeverages.id,
      name: 'Cold Brew Oat Latte',
      description: 'Single-origin Ethiopian cold brew coffee infused with creamy organic oat milk and vanilla bean syrup.',
      price: 6.5,
      image_url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80',
      modifiers: [
        { name: 'Regular (16oz)', price_delta: 0, group_name: 'Size', is_required: true },
        { name: 'Large (24oz)', price_delta: 1.5, group_name: 'Size', is_required: true },
        { name: 'Extra Espresso Shot', price_delta: 1.5, group_name: 'Add-ons', is_required: false },
        { name: 'Sugar-Free Vanilla', price_delta: 0, group_name: 'Flavor', is_required: false },
      ],
    },

    // Desserts
    {
      category_id: catDesserts.id,
      name: 'Pistachio Lava Cake',
      description: 'Warm Sicilian pistachio cake with a molten white chocolate core, served with salted caramel gelato.',
      price: 13.0,
      image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
      modifiers: [
        { name: 'Extra Gelato Scoop', price_delta: 3.0, group_name: 'Add-ons', is_required: false },
      ],
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

    // Create Modifiers
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

    // Link MenuItem to all branches via BranchMenuItem (with custom overrides)
    for (const branch of branches) {
      const isAvailable = !(branch.name.includes('Uptown') && menuItem.name.includes('Octopus'));
      const stock = menuItem.name.includes('Ribeye') ? 15 : null;

      await prisma.branchMenuItem.create({
        data: {
          branch_id: branch.id,
          menu_item_id: menuItem.id,
          is_available: isAvailable,
          stock_count: stock,
        },
      });
    }
  }

  console.log('Created menu items, modifiers, and branch availability links.');

  // 6. Create Branch-scoped Inventory Items & Transactions
  const rawIngredients = [
    { name: 'Prime Ribeye Beef (kg)', unit: 'kg', initial: 45.0, threshold: 15.0 },
    { name: 'Fresh Burrata Cheese (units)', unit: 'units', initial: 60.0, threshold: 20.0 },
    { name: 'San Marzano Tomato Sauce (liters)', unit: 'liters', initial: 100.0, threshold: 25.0 },
    { name: '00 Pizza Flour (kg)', unit: 'kg', initial: 120.0, threshold: 30.0 },
    { name: 'Wild Caught Salmon (kg)', unit: 'kg', initial: 22.0, threshold: 8.0 },
    { name: 'Organic Cold Brew Beans (kg)', unit: 'kg', initial: 30.0, threshold: 10.0 },
    { name: 'Truffle Butter (kg)', unit: 'kg', initial: 12.0, threshold: 4.0 },
  ];

  for (const branch of branches) {
    for (const ing of rawIngredients) {
      const invItem = await prisma.inventoryItem.create({
        data: {
          branch_id: branch.id,
          name: ing.name,
          unit: ing.unit,
          quantity_on_hand: ing.initial,
          reorder_threshold: ing.threshold,
        },
      });

      await prisma.inventoryTransaction.create({
        data: {
          inventory_item_id: invItem.id,
          change_amount: ing.initial,
          reason: 'restock',
        },
      });
    }
  }

  console.log('Created branch inventory and restock transactions.');

  // 7. Seed Active & Historical Orders for the Live Ticket Rail & Reports
  // Order 1: Received - Dine in Table 4
  const order1 = await prisma.order.create({
    data: {
      branch_id: downtownBranch.id,
      order_type: 'dine_in_table',
      table_id: downtownTables[3].id, // Table 4
      customer_name: 'Arthur Pendelton',
      customer_phone: '(415) 555-8921',
      status: 'received',
      subtotal: 57.0,
      total: 57.0,
      created_at: new Date(Date.now() - 4 * 60 * 1000), // 4 mins ago
      order_items: {
        create: [
          {
            menu_item_id: createdMenuItems[0].id, // Ribeye
            quantity: 1,
            unit_price: 36.0,
            selected_modifiers: [{ name: 'Medium Rare', price_delta: 0, group_name: 'Meat Temperature' }],
            notes: 'Medium rare please, butter on the side',
          },
          {
            menu_item_id: createdMenuItems[4].id, // Margherita Pizza
            quantity: 1,
            unit_price: 21.0,
            selected_modifiers: [{ name: 'Regular Crust (12")', price_delta: 0, group_name: 'Crust Size' }],
            notes: null,
          },
        ],
      },
    },
  });

  // Order 2: Preparing - Outdoor GPS with vehicle note
  const order2 = await prisma.order.create({
    data: {
      branch_id: downtownBranch.id,
      order_type: 'outdoor_gps',
      latitude: 37.7892,
      longitude: -122.4014,
      location_note: 'Market Street Entrance · Blue Subaru Outback with hazards on',
      customer_name: 'Clara Oswald',
      customer_phone: '(415) 555-4301',
      status: 'preparing',
      subtotal: 44.5,
      total: 44.5,
      created_at: new Date(Date.now() - 12 * 60 * 1000), // 12 mins ago
      order_items: {
        create: [
          {
            menu_item_id: createdMenuItems[2].id, // Burger
            quantity: 1,
            unit_price: 25.0,
            selected_modifiers: [
              { name: 'Double Patty (16oz)', price_delta: 5.5, group_name: 'Size' },
              { name: 'Avocado Slices', price_delta: 2.5, group_name: 'Add-ons' },
            ],
            notes: 'Extra napkins in the bag',
          },
          {
            menu_item_id: createdMenuItems[7].id, // Whipped Ricotta Crostini
            quantity: 1,
            unit_price: 14.0,
            selected_modifiers: [],
            notes: null,
          },
          {
            menu_item_id: createdMenuItems[10].id, // Cold Brew Oat Latte
            quantity: 1,
            unit_price: 6.5,
            selected_modifiers: [{ name: 'Regular (16oz)', price_delta: 0, group_name: 'Size' }],
            notes: null,
          },
        ],
      },
    },
  });

  // Order 3: Ready for Service - Patio 2
  const order3 = await prisma.order.create({
    data: {
      branch_id: downtownBranch.id,
      order_type: 'dine_in_table',
      table_id: downtownTables[6].id, // Patio 2
      customer_name: 'Damon Salvatore',
      customer_phone: '(415) 555-7712',
      status: 'ready',
      subtotal: 39.5,
      total: 39.5,
      created_at: new Date(Date.now() - 20 * 60 * 1000), // 20 mins ago
      order_items: {
        create: [
          {
            menu_item_id: createdMenuItems[1].id, // Salmon
            quantity: 1,
            unit_price: 28.5,
            selected_modifiers: [],
            notes: null,
          },
          {
            menu_item_id: createdMenuItems[12].id, // Tiramisu
            quantity: 1,
            unit_price: 11.5,
            selected_modifiers: [],
            notes: 'Bring with 2 dessert spoons',
          },
        ],
      },
    },
  });

  // Order 4: Completed Order with Payment (for reports)
  const order4 = await prisma.order.create({
    data: {
      branch_id: downtownBranch.id,
      order_type: 'dine_in_table',
      table_id: downtownTables[0].id, // Table 1
      customer_name: 'Jessica Pearson',
      customer_phone: '(415) 555-9002',
      status: 'completed',
      subtotal: 72.0,
      total: 72.0,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      order_items: {
        create: [
          {
            menu_item_id: createdMenuItems[0].id,
            quantity: 2,
            unit_price: 36.0,
            selected_modifiers: [{ name: 'Medium', price_delta: 0, group_name: 'Meat Temperature' }],
            notes: null,
          },
        ],
      },
      payments: {
        create: {
          method: 'card',
          amount: 72.0,
        },
      },
    },
  });

  console.log('Created live ticket queue orders and completed report history.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
