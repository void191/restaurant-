const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

// Fallback environment configurations for standalone/desktop execution
if (!process.env.DATABASE_URL) {
  const pgPort = process.env.PGPORT || '5432';
  process.env.DATABASE_URL = `postgresql://postgres:postgres@localhost:${pgPort}/restaurant_db?pgbouncer=true`;
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'restaurant_ordering_system_jwt_secret_key_2026_super_secure';
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

async function start() {
  // Ensure dir is set to __dirname so packaged asar/production builds locate .next properly
  const app = next({ dev, dir: __dirname, hostname, port });
  const handle = app.getRequestHandler();

  await app.prepare();

  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request:', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Attach Socket.io server
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH'],
    },
  });

  // Store in global for eventBus
  global.__ioInstance = io;

  io.on('connection', (socket) => {
    // Client joins branch room (for employee / admin live order pushes)
    socket.on('join_branch', (data) => {
      if (data && data.branch_id) {
        const room = `branch_${data.branch_id}`;
        socket.join(room);
      }
    });

    // Customer joins specific order room (for live order status updates)
    socket.on('join_order', (data) => {
      if (data && data.order_id) {
        const room = `order_${data.order_id}`;
        socket.join(room);
      }
    });
  });

  // Hook in event bus listeners
  if (global.__appEventBus) {
    global.__appEventBus.on('new_order', (order) => {
      io.to(`branch_${order.branch_id}`).emit('new_order', order);
      io.to(`order_${order.id}`).emit('order_status_updated', order);
    });

    global.__appEventBus.on('order_status_updated', (order) => {
      io.to(`branch_${order.branch_id}`).emit('order_status_updated', order);
      io.to(`order_${order.id}`).emit('order_status_updated', order);
    });
  }

  httpServer.listen(port, '0.0.0.0', (err) => {
    if (err) throw err;
    console.log(`> Restaurant Ordering System server ready on http://${hostname}:${port}`);
    console.log(`> Real-time WebSocket layer active`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
