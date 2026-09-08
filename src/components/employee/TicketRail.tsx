'use client';

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChefHat, Volume2, VolumeX, RefreshCw, LogOut, BellRing } from 'lucide-react';
import TicketCard, { OrderData } from './TicketCard';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  branch_id?: string | null;
  branch?: {
    id: string;
    name: string;
  } | null;
}

export interface TicketRailProps {
  user: UserSession;
  onLogout?: () => void;
  branchOverrideId?: string;
}

export default function TicketRail({ user, onLogout, branchOverrideId }: TicketRailProps) {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const effectiveBranchId = branchOverrideId || user.branch_id;

  // Play synthetic kitchen chime tone using Web Audio API
  const playKitchenChime = () => {
    if (!soundEnabled || typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Dual tone pleasant chime (E5 -> G#5)
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(830.61, now + 0.15);
      gain2.gain.setValueAtTime(0.35, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.6);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.9);
    } catch (err) {
      console.error('Failed to play kitchen audio chime:', err);
    }
  };

  // Fetch active branch orders from server
  const fetchBranchOrders = async () => {
    try {
      const url = effectiveBranchId
        ? `/api/employee/orders?branch_id=${effectiveBranchId}`
        : '/api/employee/orders';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error fetching live employee orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Advance order status
  const handleAdvanceStatus = async (orderId: string, nextStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/employee/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        const { order: updated } = await res.json();
        if (updated.status === 'completed' || updated.status === 'cancelled') {
          setOrders((prev) => prev.filter((o) => o.id !== orderId));
        } else {
          setOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: updated.status } : o))
          );
        }
      }
    } catch (err) {
      console.error('Error advancing order status:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Setup WebSocket connection and room subscription (Section 6 & 8)
  useEffect(() => {
    fetchBranchOrders();

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || window.location.origin;
    const socket = io(wsUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      if (effectiveBranchId) {
        socket.emit('join_branch', { branch_id: effectiveBranchId });
      }
    });

    // Handle new incoming order
    socket.on('new_order', (newOrder: OrderData) => {
      if (effectiveBranchId && newOrder.branch_id !== effectiveBranchId) return;

      setOrders((prev) => {
        const exists = prev.some((o) => o.id === newOrder.id);
        if (exists) return prev;
        return [newOrder, ...prev];
      });

      // Play audio chime
      playKitchenChime();

      // Native Windows Desktop Notification if running in Electron
      if (typeof window !== 'undefined' && (window as any).electronAPI?.showNotification) {
        const loc =
          newOrder.order_type === 'dine_in_table'
            ? newOrder.table?.label || 'Table'
            : newOrder.order_type === 'outdoor_gps'
            ? 'Outdoor GPS'
            : 'Pickup';

        (window as any).electronAPI.showNotification(
          `🔔 New Order #${newOrder.id.slice(-6).toUpperCase()}`,
          `${newOrder.customer_name} · ${loc} · $${newOrder.total.toFixed(2)}`
        );
      }

      setNewOrderAlert(`New Order #${newOrder.id.slice(-6).toUpperCase()} received!`);
      setTimeout(() => setNewOrderAlert(null), 5000);
    });

    // Handle order status update
    socket.on('order_status_updated', (updatedOrder: OrderData) => {
      if (effectiveBranchId && updatedOrder.branch_id !== effectiveBranchId) return;

      if (updatedOrder.status === 'completed' || updatedOrder.status === 'cancelled') {
        setOrders((prev) => prev.filter((o) => o.id !== updatedOrder.id));
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === updatedOrder.id ? { ...o, status: updatedOrder.status } : o))
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [effectiveBranchId, soundEnabled]);

  // Group orders into 3 columns (Section 6 & 9.4)
  const receivedOrders = orders.filter((o) => o.status === 'received');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');

  return (
    <div className="min-h-screen bg-paper flex flex-col font-sans">
      {/* Top Employee Station Bar (Only when standalone) */}
      {onLogout && (
        <header className="px-6 py-3.5 bg-ink text-white shadow-md flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ember flex items-center justify-center font-bold text-white shadow-sm">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-lg font-bold tracking-tight">
                  Kitchen Ticket Rail
                </h1>
                <span className="text-[11px] font-mono bg-white/10 px-2 py-0.5 rounded-full text-paper-dim border border-white/10">
                  {user.branch?.name || 'Assigned Branch'}
                </span>
              </div>
              <p className="text-xs text-muted font-mono">
                Staff: {user.name} ({user.email})
              </p>
            </div>
          </div>

          {/* Right Station Controls */}
          <div className="flex items-center gap-3">
            {/* Audio Chime Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                soundEnabled
                  ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                  : 'bg-white/5 border-white/10 text-muted hover:text-white'
              }`}
              title={soundEnabled ? 'Chime alerts enabled' : 'Chime alerts muted'}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-sage" />
                  <span className="hidden sm:inline">Chime On</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-muted" />
                  <span className="hidden sm:inline">Muted</span>
                </>
              )}
            </button>

            {/* Refresh Queue Button */}
            <button
              onClick={fetchBranchOrders}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all text-xs flex items-center gap-1.5"
              title="Refresh Live Queue"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-ember/20 hover:bg-ember text-white border border-ember/30 transition-all text-xs flex items-center gap-1.5"
              title="Sign out from Counter Station"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>
      )}

      {/* Visual New Order Alert Banner */}
      {newOrderAlert && (
        <div className="bg-ember text-white px-6 py-2.5 flex items-center justify-between text-xs font-mono font-semibold shadow-lg animate-bounce z-20">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4" />
            <span>{newOrderAlert}</span>
          </div>
          <button
            onClick={() => setNewOrderAlert(null)}
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main 3-Column Ticket Rail (Section 6 & 9.4) */}
      <main className="flex-1 p-4 sm:p-6 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto min-w-[320px]">
          {/* Column 1: Received */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-muted/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-muted" />
                <h2 className="font-serif text-lg font-bold text-ink">Received</h2>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-paper-dim text-ink border border-paper-dim">
                {receivedOrders.length}
              </span>
            </div>

            <div className="space-y-4 flex-1">
              {receivedOrders.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border-2 border-dashed border-paper-dim text-muted text-xs font-mono">
                  No orders waiting to prepare
                </div>
              ) : (
                receivedOrders.map((order) => (
                  <TicketCard
                    key={order.id}
                    order={order}
                    onAdvanceStatus={handleAdvanceStatus}
                    isUpdating={updatingOrderId === order.id}
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 2: Preparing */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-amber/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber" />
                <h2 className="font-serif text-lg font-bold text-ink">Preparing</h2>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-amber/10 text-amber border border-amber/20">
                {preparingOrders.length}
              </span>
            </div>

            <div className="space-y-4 flex-1">
              {preparingOrders.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border-2 border-dashed border-paper-dim text-muted text-xs font-mono">
                  No tickets currently on the grill
                </div>
              ) : (
                preparingOrders.map((order) => (
                  <TicketCard
                    key={order.id}
                    order={order}
                    onAdvanceStatus={handleAdvanceStatus}
                    isUpdating={updatingOrderId === order.id}
                  />
                ))
              )}
            </div>
          </div>

          {/* Column 3: Ready for Service */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-2 border-sage/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sage" />
                <h2 className="font-serif text-lg font-bold text-ink">Ready for Service</h2>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-sage-dim text-sage border border-sage/20">
                {readyOrders.length}
              </span>
            </div>

            <div className="space-y-4 flex-1">
              {readyOrders.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border-2 border-dashed border-paper-dim text-muted text-xs font-mono">
                  No orders waiting for runner / pickup
                </div>
              ) : (
                readyOrders.map((order) => (
                  <TicketCard
                    key={order.id}
                    order={order}
                    onAdvanceStatus={handleAdvanceStatus}
                    isUpdating={updatingOrderId === order.id}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
