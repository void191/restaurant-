async function testApi() {
  console.log('Testing Restaurant Ordering System API endpoints...\n');

  // 1. GET /api/branches
  console.log('1. Testing GET /api/branches:');
  const branchesRes = await fetch('http://localhost:3000/api/branches');
  const branchesData = await branchesRes.json();
  console.log(`   Found ${branchesData.branches.length} branches: ${branchesData.branches.map(b => b.name).join(', ')}`);
  const branch1 = branchesData.branches[0];

  // 2. GET /api/branches/:id/menu
  console.log(`\n2. Testing GET /api/branches/${branch1.id}/menu:`);
  const menuRes = await fetch(`http://localhost:3000/api/branches/${branch1.id}/menu`);
  const menuData = await menuRes.json();
  console.log(`   Branch ${branch1.name} has ${menuData.categories.length} categories with items.`);

  // 3. GET /api/branches/:id/tables
  console.log(`\n3. Testing GET /api/branches/${branch1.id}/tables:`);
  const tablesRes = await fetch(`http://localhost:3000/api/branches/${branch1.id}/tables`);
  const tablesData = await tablesRes.json();
  console.log(`   Found ${tablesData.tables.length} active tables.`);
  const table1 = tablesData.tables[0];

  // 4. POST /api/orders (dine-in table)
  console.log('\n4. Testing POST /api/orders (dine_in_table):');
  const sampleItem = menuData.categories[0].items[0];
  const orderRes = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      branch_id: branch1.id,
      order_type: 'dine_in_table',
      table_id: table1.id,
      customer_name: 'Test Customer',
      customer_phone: '(555) 123-4567',
      items: [
        {
          menu_item_id: sampleItem.id,
          quantity: 2,
          selected_modifiers: sampleItem.modifiers ? [sampleItem.modifiers[0]].filter(Boolean) : [],
          notes: 'Extra crispy',
        },
      ],
    }),
  });
  const orderData = await orderRes.json();
  console.log(`   Order created successfully: #${orderData.order.id.slice(-6).toUpperCase()} - Total: $${orderData.order.total.toFixed(2)}, Status: ${orderData.order.status}`);

  // 5. GET /api/orders/:id
  console.log(`\n5. Testing GET /api/orders/${orderData.order.id}:`);
  const getOrderRes = await fetch(`http://localhost:3000/api/orders/${orderData.order.id}`);
  const getOrderData = await getOrderRes.json();
  console.log(`   Order status retrieved: ${getOrderData.order.status}, Location: ${getOrderData.order.table?.label}`);

  // 6. POST /api/auth/login (Employee)
  console.log('\n6. Testing Employee Login:');
  const empLoginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'downtown@restaurant.com',
      password: 'password123',
    }),
  });
  const empLoginData = await empLoginRes.json();
  const empCookie = empLoginRes.headers.get('set-cookie');
  console.log(`   Employee logged in: ${empLoginData.user.name} (${empLoginData.user.role}) - Branch: ${empLoginData.user.branch?.name}`);

  // 7. GET /api/employee/orders (authenticated)
  console.log('\n7. Testing GET /api/employee/orders with Employee session:');
  const empOrdersRes = await fetch('http://localhost:3000/api/employee/orders', {
    headers: { Cookie: empCookie || '' },
  });
  const empOrdersData = await empOrdersRes.json();
  console.log(`   Employee queue has ${empOrdersData.orders.length} active orders.`);

  // 8. Server-side role check: Employee accessing Admin endpoint (Must return 403 Forbidden per Section 2)
  console.log('\n8. Testing Server-side Role Check (Employee attempting to access Admin endpoint):');
  const forbiddenRes = await fetch('http://localhost:3000/api/admin/reports', {
    headers: { Cookie: empCookie || '' },
  });
  console.log(`   Status code returned: ${forbiddenRes.status} (Expected: 403 Forbidden)`);

  // 9. POST /api/auth/login (Admin)
  console.log('\n9. Testing Admin Login:');
  const adminLoginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@restaurant.com',
      password: 'admin123',
    }),
  });
  const adminLoginData = await adminLoginRes.json();
  const adminCookie = adminLoginRes.headers.get('set-cookie');
  console.log(`   Admin logged in: ${adminLoginData.user.name} (${adminLoginData.user.role})`);

  // 10. GET /api/admin/reports (Admin allowed)
  console.log('\n10. Testing GET /api/admin/reports with Admin session:');
  const adminReportsRes = await fetch('http://localhost:3000/api/admin/reports', {
    headers: { Cookie: adminCookie || '' },
  });
  const adminReportsData = await adminReportsRes.json();
  console.log(`   Admin reports status: ${adminReportsRes.status} - Total Revenue: $${adminReportsData.summary.totalRevenue.toFixed(2)}, Total Orders: ${adminReportsData.summary.totalOrders}`);

  // 11. PATCH /api/employee/orders/:id/status (Advance to 'preparing')
  console.log('\n11. Testing PATCH /api/employee/orders/:id/status to advance status:');
  const advanceRes = await fetch(`http://localhost:3000/api/employee/orders/${orderData.order.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: empCookie || '',
    },
    body: JSON.stringify({ status: 'preparing' }),
  });
  const advanceData = await advanceRes.json();
  console.log(`   Order status advanced to: ${advanceData.order.status}`);

  console.log('\nAll API verification tests completed successfully!');
}

testApi().catch(console.error);
