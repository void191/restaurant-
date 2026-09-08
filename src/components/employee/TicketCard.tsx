'use client';

import React from 'react';
import { Clock, MapPin, Utensils, ShoppingBag, ArrowRight } from 'lucide-react';

interface OrderItemData {
  id: string;
  quantity: number;
  unit_price: number;
  selected_modifiers?: Array<{ name: string; price_delta: number }>;
  notes?: string | null;
  menu_item: {
    name: string;
  };
}

export interface TicketOrder {
  id: string;
  branch_id: string;
  order_type: 'dine_in_table' | 'outdoor_gps' | 'pickup';
  table_id: string | null;
  table?: { label: string } | null;
  latitude: number | null;
  longitude: number | null;
  location_note: string | null;
  customer_name: string;
  customer_phone: string | null;
  status: 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  subtotal: number;
  total: number;
  created_at: string;
  order_items: OrderItemData[];
}

interface TicketCardProps {
  order: TicketOrder;
  onAdvanceStatus: (orderId: string, nextStatus: string) => void;
  isUpdating?: boolean;
}

export default function TicketCard({
  order,
  onAdvanceStatus,
  isUpdating,
}: TicketCardProps) {
  // Compute elapsed time in minutes/hours
  const createdDate = new Date(order.created_at);
  const now = new Date();
  const diffMinutes = Math.max(0, Math.floor((now.getTime() - createdDate.getTime()) / 60000));
  const timeFormatted =
    diffMinutes < 60
      ? `${diffMinutes}m ago`
      : `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m ago`;

  // Determine next status and button styling per Section 9.4
  let nextStatus = '';
  let buttonLabel = '';
  let buttonClass = '';

  if (order.status === 'received') {
    nextStatus = 'preparing';
    buttonLabel = 'Start preparing';
    buttonClass = 'bg-ink text-white hover:bg-ink/90';
  } else if (order.status === 'preparing') {
    nextStatus = 'ready';
    buttonLabel = 'Mark ready';
    buttonClass = 'bg-amber text-white hover:bg-amber/90';
  } else if (order.status === 'ready') {
    nextStatus = 'completed';
    buttonLabel = 'Mark completed';
    buttonClass = 'bg-sage text-white hover:bg-sage/90';
  }

  // Location Visual per Section 9.4
  const renderLocationBadge = () => {
    if (order.order_type === 'dine_in_table') {
      // Small pill badge only (sage-dim background, table label)
      return (
        <div className="inline-flex items-center gap-1.5 bg-sage-dim text-sage px-3 py-1.5 rounded-lg text-xs font-mono font-bold">
          <Utensils className="w-3.5 h-3.5" />
          <span>{order.table?.label || 'Dine-in Table'}</span>
        </div>
      );
    }

    if (order.order_type === 'outdoor_gps') {
      // Small map thumbnail directly above the location pill per Section 9.4
      return (
        <div className="space-y-1.5">
          {/* Stylized Pin-on-grid Map Thumbnail */}
          <div className="relative h-20 w-full bg-[#E5E0D8] rounded-lg overflow-hidden border border-paper-dim flex items-center justify-center">
            {/* Grid lines pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #211C1A 1px, transparent 1px), linear-gradient(to bottom, #211C1A 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />
            {/* Compass / Street layout aesthetic */}
            <div className="absolute top-1 right-2 text-[9px] font-mono text-muted uppercase">
              GPS AREA
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="p-1.5 rounded-full bg-ember text-white shadow-md animate-bounce">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-mono font-bold text-ink bg-white/90 px-1.5 py-0.5 rounded mt-0.5 shadow-sm">
                OUTDOOR WALK
              </span>
            </div>
          </div>

          {/* Location note pill */}
          <div className="bg-ember/10 text-ember px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-start gap-1.5 border border-ember/20">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span className="leading-tight font-medium">
              {order.location_note || 'Outdoor GPS location'}
            </span>
          </div>
        </div>
      );
    }

    // Pickup fallback per Section 9.4
    return (
      <div className="bg-paper text-ink px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-start gap-1.5 border border-paper-dim">
        <ShoppingBag className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
        <span className="leading-tight font-medium">
          Pickup: {order.location_note || 'Counter pickup'}
        </span>
      </div>
    );
  };

  return (
    <div className="ticket-torn-top rounded-b-2xl shadow-md border border-paper-dim flex flex-col overflow-hidden bg-white hover:shadow-lg transition-shadow">
      {/* Ticket Header */}
      <div className="p-4 bg-white border-b border-paper-dim">
        <div className="flex items-center justify-between">
          <span className="font-mono text-base font-bold text-ink tracking-wider">
            #{order.id.slice(-6).toUpperCase()}
          </span>
          <span className="flex items-center gap-1 font-mono text-xs text-muted">
            <Clock className="w-3.5 h-3.5" /> {timeFormatted}
          </span>
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <span className="font-serif text-lg font-bold text-ink">
            {order.customer_name}
          </span>
          {order.customer_phone && (
            <span className="font-mono text-xs text-muted">
              {order.customer_phone}
            </span>
          )}
        </div>
      </div>

      {/* Ticket Location Badge Section (Section 9.4) */}
      <div className="px-4 py-3 bg-paper/40 border-b border-paper-dim">
        {renderLocationBadge()}
      </div>

      {/* Ticket Item List with receipt typography (Section 9.4) */}
      <div className="p-4 space-y-3 flex-1">
        <div className="space-y-2.5">
          {order.order_items.map((item) => (
            <div key={item.id} className="text-sm">
              <div className="flex items-start justify-between">
                <span className="font-mono text-ink">
                  <span className="font-bold mr-2">{item.quantity}x</span>
                  <span className="font-sans font-medium">{item.menu_item.name}</span>
                </span>
                <span className="font-mono text-xs text-muted ml-2">
                  ${(item.unit_price * item.quantity).toFixed(2)}
                </span>
              </div>

              {/* Modifiers line */}
              {item.selected_modifiers && item.selected_modifiers.length > 0 && (
                <div className="pl-6 text-xs font-mono text-muted space-y-0.5">
                  {item.selected_modifiers.map((mod, idx) => (
                    <div key={idx}>+ {mod.name}</div>
                  ))}
                </div>
              )}

              {/* Item Note */}
              {item.notes && (
                <div className="pl-6 text-xs text-ember italic">
                  Note: {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Customer Note in ember text beneath item list per Section 9.4 */}
        {order.location_note && order.order_type !== 'outdoor_gps' && (
          <div className="border-t border-dashed border-paper-dim pt-2 mt-2">
            <p className="text-xs font-mono text-ember font-medium leading-tight">
              ⚠️ Note: {order.location_note}
            </p>
          </div>
        )}
      </div>

      {/* Dashed Rule separating item list from footer per Section 9.4 */}
      <div className="border-t border-dashed border-paper-dim" />

      {/* Ticket Footer & Single Action Button per Section 9.4 */}
      <div className="p-4 bg-paper/50 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-muted">
          <span>Items: {order.order_items.reduce((sum, i) => sum + i.quantity, 0)}</span>
          <span className="font-bold text-ink text-sm">${order.total.toFixed(2)}</span>
        </div>

        {/* Exactly one full-width action button matching column color per Section 9.4 */}
        {nextStatus && (
          <button
            onClick={() => onAdvanceStatus(order.id, nextStatus)}
            disabled={isUpdating}
            className={`w-full py-3 px-4 rounded-xl text-xs font-mono font-bold tracking-wide uppercase shadow transition-all active:scale-[0.99] flex items-center justify-center gap-2 ${buttonClass} disabled:opacity-50`}
          >
            <span>{buttonLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
