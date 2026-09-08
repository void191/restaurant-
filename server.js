const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

async function start() {
  const app = next({ dev, hostname, port });
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

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Restaurant Ordering System server ready on http://${hostname}:${port}`);
    console.log(`> Real-time WebSocket layer active`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
