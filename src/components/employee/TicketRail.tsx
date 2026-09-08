'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  Bell,
  Volume2,
  VolumeX,
  LogOut,
  RefreshCw,
  Clock,
  Radio,
  Sparkles,
} from 'lucide-react';
import TicketCard, { TicketOrder } from './TicketCard';

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  branch_id?: string | null;
  branch?: { id: string; name: string } | null;
}

interface TicketRailProps {
  user: UserSession;
  onLogout: () => void;
  branchOverrideId?: string; // For admin viewing specific branch
}

export default function TicketRail({
  user,
  onLogout,
  branchOverrideId,
}: TicketRailProps) {
  const branchId = branchOverrideId || user.branch_id || user.branch?.id;
  const [orders, setOrders] = useState<TicketOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);

  // Audio synthesizer for kitchen chime
  const playChime = () => {
    if (!audioEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      // Ding (Higher pitch)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
      gain1.gain.setValueAtTime(0.3, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.8);

      // Dong (Lower pitch)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.log('Audio playback error (user interaction required):', e);
    }
  };

  // Fetch active queue orders from API
  const fetchOrders = async () => {
    try {
      const url = branchId
        ? `/api/employee/orders?branch_id=${branchId}`
        : '/api/employee/orders';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching employee queue orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // WebSocket connection for live order updates
    const socketUrl = process.env.NEXT_PUBLIC_WS_URL || window.location.origin;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      if (branchId) {
        socket.emit('join_branch', { branch_id: branchId });
      }
    });

    // New order arrives in real time
    socket.on('new_order', (newOrder: TicketOrder) => {
      if (!branchId || newOrder.branch_id === branchId) {
        setOrders((prev) => {
          if (prev.some((o) => o.id === newOrder.id)) return prev;
          return [newOrder, ...prev];
        });

        // Audible and visible notification per Section 6
        playChime();
        setNewOrderAlert(`New Order #${newOrder.id.slice(-6).toUpperCase()} by ${newOrder.customer_name}!`);
        setTimeout(() => setNewOrderAlert(null), 6000);
      }
    });

    // Order status updated
    socket.on('order_status_updated', (updatedOrder: TicketOrder) => {
      if (!branchId || updatedOrder.branch_id === branchId) {
        setOrders((prev) => {
          if (updatedOrder.status === 'completed' || updatedOrder.status === 'cancelled') {
            return prev.filter((o) => o.id !== updatedOrder.id);
          }
          return prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
        });
      }
    });

    // Periodic polling fallback
    const interval = setInterval(fetchOrders, 6000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [branchId]);

  // Handle status advance
  const handleAdvanceStatus = async (orderId: string, nextStatus: string) => {
    setUpdatingIds((prev) => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetch(`/api/employee/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated = data.order;
        setOrders((prev) => {
          if (nextStatus === 'completed' || nextStatus === 'cancelled') {
            return prev.filter((o) => o.id !== orderId);
          }
          return prev.map((o) => (o.id === orderId ? updated : o));
        });
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    } finally {
      setUpdatingIds((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // Group orders into 3 columns per Section 9.4
  const receivedOrders = orders.filter((o) => o.status === 'received');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');

  const columns = [
    {
      id: 'received',
      title: 'Received',
      dotColor: 'bg-muted',
      borderColor: 'border-muted/30',
      orders: receivedOrders,
    },
    {
      id: 'preparing',
      title: 'Preparing',
      dotColor: 'bg-amber',
      borderColor: 'border-amber/30',
      orders: preparingOrders,
    },
    {
      id: 'ready',
      title: 'Ready for Service',
      dotColor: 'bg-sage',
      borderColor: 'border-sage/30',
      orders: readyOrders,
    },
  ];

  return (
    <div className="min-h-screen bg-paper flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="bg-ink text-white px-6 py-4 border-b border-black/20 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-wide">
              Kitchen Ticket Rail
            </h1>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded bg-white/10 text-xs font-mono text-paper-dim">
            {user.branch?.name || 'Assigned Branch'}
          </span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Audio Chime Toggle */}
          <button
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              if (!audioEnabled) playChime();
            }}
            className={`p-2 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors ${
              audioEnabled ? 'bg-white/15 text-white' : 'bg-white/5 text-muted'
            }`}
            title={audioEnabled ? 'Sound alert enabled' : 'Sound alert muted'}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">{audioEnabled ? 'Audio On' : 'Muted'}</span>
          </button>

          {/* Refresh button */}
          <button
            onClick={fetchOrders}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Refresh orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Staff profile & Logout */}
          <div className="flex items-center gap-3 pl-3 border-l border-white/20">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold leading-tight">{user.name}</p>
              <p className="text-[10px] font-mono text-paper-dim/70 uppercase">
                {user.role}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg bg-ember/90 hover:bg-ember text-white transition-colors flex items-center gap-1 text-xs font-mono"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Visible Real-time New Order Banner (Section 6) */}
      {newOrderAlert && (
        <div className="bg-ember text-white px-6 py-3 font-mono text-sm font-bold flex items-center justify-between animate-slideDown shadow-md">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 animate-bounce" />
            <span>🔔 {newOrderAlert}</span>
          </div>
          <button
            onClick={() => setNewOrderAlert(null)}
            className="text-xs underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main 3-Column Ticket Rail per Section 9.4 */}
      <main className="flex-1 p-4 sm:p-6 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-w-[768px]">
          {columns.map((col) => (
            <div
              key={col.id}
              className="bg-paper-dim/40 rounded-2xl p-4 border border-paper-dim flex flex-col max-h-[calc(100vh-140px)]"
            >
              {/* Column Header per Section 9.4 */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-paper-dim px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${col.dotColor}`} />
                  <h2 className="font-serif text-lg font-bold text-ink">
                    {col.title}
                  </h2>
                </div>
                {/* Live Count */}
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-white text-ink border border-paper-dim shadow-sm">
                  {col.orders.length}
                </span>
              </div>

              {/* Column Ticket Cards Scrollable */}
              <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                {col.orders.length === 0 ? (
                  <div className="text-center py-16 text-muted font-mono text-xs border-2 border-dashed border-paper-dim rounded-xl">
                    No orders {col.title.toLowerCase()}
                  </div>
                ) : (
                  col.orders.map((order) => (
                    <TicketCard
                      key={order.id}
                      order={order}
                      onAdvanceStatus={handleAdvanceStatus}
                      isUpdating={updatingIds[order.id]}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
