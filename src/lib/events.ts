import { EventEmitter } from 'events';

// In-memory event bus for bridging API routes and WebSocket server in the Node process
class AppEventBus extends EventEmitter {}

declare global {
  var __appEventBus: AppEventBus | undefined;
  var __ioInstance: any | undefined;
}

export const eventBus = global.__appEventBus || new AppEventBus();
if (process.env.NODE_ENV !== 'production') {
  global.__appEventBus = eventBus;
}

export function notifyNewOrder(order: any) {
  eventBus.emit('new_order', order);
  if (global.__ioInstance) {
    global.__ioInstance.to(`branch_${order.branch_id}`).emit('new_order', order);
    global.__ioInstance.to(`order_${order.id}`).emit('order_status_updated', order);
  }
}

export function notifyOrderStatusUpdated(order: any) {
  eventBus.emit('order_status_updated', order);
  if (global.__ioInstance) {
    global.__ioInstance.to(`branch_${order.branch_id}`).emit('order_status_updated', order);
    global.__ioInstance.to(`order_${order.id}`).emit('order_status_updated', order);
  }
}
