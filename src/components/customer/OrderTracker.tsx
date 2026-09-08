'use client';

import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Bell,
  Sparkles,
  MapPin,
  Utensils,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface OrderTrackerProps {
  orderId: string;
  initialOrder?: any;
  onNewOrder: () => void;
}

const STATUS_STEPS = [
  { key: 'received', label: 'Order Received', desc: 'Sent to the kitchen ticket rail' },
  { key: 'preparing', label: 'Preparing', desc: 'Chefs are crafting your dishes' },
  { key: 'ready', label: 'Ready for Service', desc: 'Plated & ready for table delivery / pickup' },
  { key: 'completed', label: 'Completed', desc: 'Enjoy your artisan meal!' },
];

export default function OrderTracker({
  orderId,
  initialOrder,
  onNewOrder,
}: OrderTrackerProps) {
  const [order, setOrder] = useState<any>(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Function to fetch order status
  const fetchOrderStatus = async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching order status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderStatus();

    // Setup WebSocket connection for live order updates per Section 5.4
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || window.location.origin;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      // Join order specific room
      socket.emit('join_order', { order_id: orderId });
    });

    socket.on('order_status_updated', (updatedOrder: any) => {
      if (updatedOrder && updatedOrder.id === orderId) {
        setOrder(updatedOrder);
        setLastUpdated(new Date());
      }
    });

    // Fallback polling every 8s if socket drops
    const pollInterval = setInterval(() => {
      fetchOrderStatus();
    }, 8000);

    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
    };
  }, [orderId]);

  if (loading && !order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-ember mb-3" />
        <h2 className="font-serif text-2xl text-ink">Retrieving your order...</h2>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="font-serif text-2xl text-ink mb-2">Order Not Found</h2>
        <p className="text-sm text-muted mb-6">Could not find details for order #{orderId}.</p>
        <button
          onClick={onNewOrder}
          className="px-6 py-3 bg-ink text-white rounded-xl text-sm font-medium"
        >
          Start New Order
        </button>
      </div>
    );
  }

  const currentStatus = order.status; // 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-24 space-y-6 animate-fadeIn">
      {/* Success Badge & Order Header */}
      <div className="bg-white p-6 rounded-2xl border border-paper-dim shadow-sm text-center">
        <div className="inline-flex p-3 rounded-full bg-sage-dim text-sage mb-3">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <p className="text-xs uppercase font-mono tracking-widest text-muted">
          ORDER CONFIRMED & IN SERVICE
        </p>
        <h1 className="font-serif text-3xl text-ink font-semibold mt-1">
          Thank you, {order.customer_name}!
        </h1>

        <div className="mt-3 inline-flex items-center gap-2 bg-paper px-3 py-1.5 rounded-lg border border-paper-dim">
          <span className="text-xs font-mono text-muted">Order Ref:</span>
          <span className="font-mono font-bold text-sm text-ink tracking-wider">
            #{order.id.slice(-6).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Live Status Stepper (Section 5.4) */}
      <div className="bg-white p-6 rounded-2xl border border-paper-dim shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-paper-dim pb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="font-serif text-lg font-semibold text-ink">
              Live Kitchen Progress
            </h2>
          </div>
          <span className="text-[11px] font-mono text-muted">
            Live via WebSocket
          </span>
        </div>

        {/* Steps List */}
        <div className="space-y-6">
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex || currentStatus === 'completed';
            const isCurrent = idx === currentStepIndex && currentStatus !== 'completed';
            const isUpcoming = idx > currentStepIndex && currentStatus !== 'completed';

            return (
              <div key={step.key} className="flex items-start gap-4">
                {/* Step Circle & Connector */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-sage text-white'
                        : isCurrent
                        ? 'bg-amber text-white ring-4 ring-amber/20 scale-110'
                        : 'bg-paper text-muted border border-paper-dim'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isCurrent ? (
                      step.key === 'preparing' ? (
                        <ChefHat className="w-4 h-4 animate-bounce" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )
                    ) : (
                      idx + 1
                    )}
                  </div>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div
                      className={`w-0.5 h-10 mt-1 transition-colors ${
                        isCompleted ? 'bg-sage' : 'bg-paper-dim'
                      }`}
                    />
                  )}
                </div>

                {/* Step Text */}
                <div className="pt-1">
                  <h3
                    className={`font-serif text-base font-semibold ${
                      isCurrent
                        ? 'text-ink'
                        : isCompleted
                        ? 'text-sage'
                        : 'text-muted'
                    }`}
                  >
                    {step.label}
                  </h3>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Details Ticket Summary */}
      <div className="bg-white p-6 rounded-2xl border border-paper-dim shadow-sm space-y-4">
        <h3 className="font-serif text-lg font-semibold text-ink border-b border-paper-dim pb-2">
          Order Summary
        </h3>

        <div className="space-y-3">
          {order.order_items?.map((item: any, i: number) => (
            <div key={i} className="flex items-start justify-between text-sm">
              <div>
                <span className="font-mono font-bold text-ink mr-2">
                  {item.quantity}x
                </span>
                <span className="font-medium text-ink">
                  {item.menu_item?.name || 'Dish'}
                </span>
                {item.selected_modifiers && item.selected_modifiers.length > 0 && (
                  <div className="text-xs font-mono text-muted pl-6 mt-0.5">
                    {item.selected_modifiers.map((m: any) => m.name).join(', ')}
                  </div>
                )}
                {item.notes && (
                  <div className="text-xs text-ember italic pl-6 mt-0.5">
                    &quot;{item.notes}&quot;
                  </div>
                )}
              </div>
              <span className="font-mono font-bold text-ink">
                ${(item.unit_price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-paper-dim pt-3 flex items-center justify-between font-mono font-bold text-base text-ink">
          <span>Total</span>
          <span className="text-lg">${order.total.toFixed(2)}</span>
        </div>

        {/* Location badge in summary */}
        <div className="pt-2">
          <div className="p-3 bg-paper rounded-xl flex items-center gap-2.5 text-xs">
            {order.order_type === 'dine_in_table' ? (
              <Utensils className="w-4 h-4 text-sage shrink-0" />
            ) : (
              <MapPin className="w-4 h-4 text-ember shrink-0" />
            )}
            <div>
              <span className="font-mono uppercase font-bold text-muted text-[10px] block">
                Delivery / Service Location:
              </span>
              <span className="font-semibold text-ink">
                {order.table?.label || order.location_note || 'Designated branch location'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Start New Order Button */}
      <button
        onClick={onNewOrder}
        className="w-full py-4 bg-ink text-white rounded-xl text-sm font-medium hover:bg-ink/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md"
      >
        <span>Browse Menu & Order More</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
