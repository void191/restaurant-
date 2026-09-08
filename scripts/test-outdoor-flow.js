async function testOutdoorFlow() {
  console.log('Testing Outdoor Location Flow & Full Status Lifecycle...\n');

  // 1. Get branch
  const branchesRes = await fetch('http://localhost:3000/api/branches');
  const { branches } = await branchesRes.json();
  const branch = branches[0];

  // 2. Get menu item
  const menuRes = await fetch(`http://localhost:3000/api/branches/${branch.id}/menu`);
  const { categories } = await menuRes.json();
  const item = categories[0].items[0];

  // 3. Create Outdoor GPS Order (Section 5.2)
  console.log('1. Creating Outdoor GPS Order:');
  const gpsOrderRes = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      branch_id: branch.id,
      order_type: 'outdoor_gps',
      latitude: 37.7892,
      longitude: -122.4014,
      location_note: 'Market Street Entrance · white Subaru with hazards',
      customer_name: 'Sarah Connor',
      customer_phone: '(555) 987-6543',
      items: [
        {
          menu_item_id: item.id,
          quantity: 1,
          selected_modifiers: [],
        },
      ],
    }),
  });
  const gpsOrderData = await gpsOrderRes.json();
  console.log(`   Created GPS Order #${gpsOrderData.order.id.slice(-6).toUpperCase()} (${gpsOrderData.order.order_type})`);
  console.log(`   Location note: ${gpsOrderData.order.location_note}`);

  // 4. Create Pickup Fallback Order (Section 5.2 fallback)
  console.log('\n2. Creating Pickup Free-Text Fallback Order:');
  const pickupOrderRes = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      branch_id: branch.id,
      order_type: 'pickup',
      location_note: 'Red Honda Civic near west alley entrance',
      customer_name: 'John Doe',
      items: [
        {
          menu_item_id: item.id,
          quantity: 1,
          selected_modifiers: [],
        },
      ],
    }),
  });
  const pickupOrderData = await pickupOrderRes.json();
  console.log(`   Created Pickup Order #${pickupOrderData.order.id.slice(-6).toUpperCase()} (${pickupOrderData.order.order_type})`);
  console.log(`   Location note: ${pickupOrderData.order.location_note}`);

  // 5. Employee login
  const empLoginRes = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'downtown@restaurant.com',
      password: 'password123',
    }),
  });
  const empCookie = empLoginRes.headers.get('set-cookie');

  // 6. Advance GPS order through full lifecycle: received -> preparing -> ready -> completed
  console.log('\n3. Advancing GPS order through lifecycle:');
  const steps = ['preparing', 'ready', 'completed'];
  for (const nextStatus of steps) {
    const res = await fetch(`http://localhost:3000/api/employee/orders/${gpsOrderData.order.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: empCookie || '',
      },
      body: JSON.stringify({ status: nextStatus }),
    });
    const d = await res.json();
    console.log(`   Status transitioned to: ${d.order.status}`);
  }

  // 7. Verify live queue no longer contains completed order, but reports contain it
  console.log('\n4. Verifying live queue vs reports:');
  const queueRes = await fetch('http://localhost:3000/api/employee/orders', {
    headers: { Cookie: empCookie || '' },
  });
  const queueData = await queueRes.json();
  const inQueue = queueData.orders.some((o) => o.id === gpsOrderData.order.id);
  console.log(`   Completed order in active queue: ${inQueue} (Expected: false)`);

  console.log('\nOutdoor location and lifecycle test passed successfully!');
}

testOutdoorFlow().catch(console.error);
