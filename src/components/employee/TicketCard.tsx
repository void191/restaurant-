'use client';

import React from 'react';
import { Clock, MapPin, Table2, User, Phone, CheckCircle2, ChevronRight, Printer } from 'lucide-react';

export interface OrderItemModifier {
  name: string;
  price_delta: number;
  group_name?: string;
}

export interface OrderItemData {
  id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  selected_modifiers: OrderItemModifier[];
  notes?: string | null;
  menu_item?: {
    name: string;
    price: number;
  };
}

export interface OrderData {
  id: string;
  branch_id: string;
  order_type: 'dine_in_table' | 'outdoor_gps' | 'pickup';
  table_id?: string | null;
  table?: {
    label: string;
  } | null;
  latitude?: number | null;
  longitude?: number | null;
  location_note?: string | null;
  customer_name: string;
  customer_phone?: string | null;
  status: 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  total: number;
  subtotal: number;
  created_at: string;
  order_items: OrderItemData[];
}

interface TicketCardProps {
  order: OrderData;
  onAdvanceStatus: (orderId: string, nextStatus: string) => void;
  isUpdating?: boolean;
}

export default function TicketCard({
  order,
  onAdvanceStatus,
  isUpdating = false,
}: TicketCardProps) {
  // Format elapsed time
  const formatElapsed = (dateStr: string) => {
    const elapsedMs = Date.now() - new Date(dateStr).getTime();
    const elapsedMins = Math.max(0, Math.floor(elapsedMs / 60000));
    if (elapsedMins < 1) return 'Just now';
    if (elapsedMins < 60) return `${elapsedMins}m ago`;
    const hrs = Math.floor(elapsedMins / 60);
    const mins = elapsedMins % 60;
    return `${hrs}h ${mins}m ago`;
  };

  const nextStatusConfig = {
    received: {
      next: 'preparing',
      label: 'Start Preparing',
      color: 'bg-ink hover:bg-ink/90 text-white',
    },
    preparing: {
      next: 'ready',
      label: 'Mark Ready for Service',
      color: 'bg-amber hover:bg-amber/90 text-white',
    },
    ready: {
      next: 'completed',
      label: 'Mark Completed',
      color: 'bg-sage hover:bg-sage/90 text-white',
    },
    completed: null,
    cancelled: null,
  };

  const currentAction = nextStatusConfig[order.status];

  // Print Kitchen Ticket
  const handlePrintTicket = () => {
    const ticketHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order #${order.id.slice(-6).toUpperCase()}</title>
        <style>
          body { font-family: monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
          h2, h3 { margin: 4px 0; text-align: center; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .item { display: flex; justify-content: space-between; margin: 6px 0; }
          .note { color: #C1432E; font-size: 12px; margin-left: 10px; }
          .footer { text-align: center; font-size: 11px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <h2>ARTISAN KITCHEN</h2>
        <h3>Order #${order.id.slice(-6).toUpperCase()}</h3>
        <p style="text-align:center; font-size:12px;">${new Date(order.created_at).toLocaleTimeString()}</p>
        <div class="divider"></div>
        <p><strong>Customer:</strong> ${order.customer_name}</p>
        <p><strong>Type:</strong> ${order.order_type.toUpperCase()}</p>
        ${order.table ? `<p><strong>Location:</strong> ${order.table.label}</p>` : ''}
        ${order.location_note ? `<p><strong>Note:</strong> ${order.location_note}</p>` : ''}
        <div class="divider"></div>
        ${order.order_items
          .map(
            (i) => `
          <div class="item">
            <span><strong>${i.quantity}x</strong> ${i.menu_item?.name || 'Item'}</span>
            <span>$${(i.unit_price * i.quantity).toFixed(2)}</span>
          </div>
          ${i.selected_modifiers?.map((m) => `<div style="font-size:11px; margin-left:10px;">+ ${m.name}</div>`).join('') || ''}
          ${i.notes ? `<div class="note">* ${i.notes}</div>` : ''}
        `
          )
          .join('')}
        <div class="divider"></div>
        <div class="item">
          <strong>TOTAL</strong>
          <strong>$${order.total.toFixed(2)}</strong>
        </div>
        <div class="footer">Thank you for dining with us!</div>
      </body>
      </html>
    `;

    if (typeof window !== 'undefined' && (window as any).electronAPI?.printTicket) {
      (window as any).electronAPI.printTicket(ticketHtml);
    } else {
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.write(ticketHtml);
        printWin.document.close();
        printWin.focus();
        printWin.print();
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-paper-dim shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden relative font-sans flex flex-col justify-between">
      {/* Perforated / Torn edge visual effect at top (Section 9.4) */}
      <div className="ticket-torn-top bg-white border-t border-paper-dim" />

      {/* Main Ticket Content */}
      <div className="p-4 space-y-3.5">
        {/* Header: Monospace Order ID + Elapsed Timestamp */}
        <div className="flex items-center justify-between pb-2.5 border-b border-paper-dim/80">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-ink bg-paper px-2 py-0.5 rounded-md tracking-wider">
              #{order.id.slice(-6).toUpperCase()}
            </span>
            <button
              onClick={handlePrintTicket}
              className="p-1 rounded hover:bg-paper text-muted hover:text-ink transition-colors"
              title="Print Kitchen Ticket"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1 font-mono text-xs text-muted">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatElapsed(order.created_at)}</span>
          </div>
        </div>

        {/* Location Badge (Section 9.4) */}
        <div>
          {order.order_type === 'dine_in_table' && order.table && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-dim text-sage font-medium text-xs">
              <Table2 className="w-3.5 h-3.5" />
              <span>{order.table.label}</span>
            </div>
          )}

          {order.order_type === 'outdoor_gps' && (
            <div className="space-y-1.5">
              {/* Map Thumbnail for Outdoor GPS Orders (Section 9.4) */}
              <div className="h-16 rounded-xl bg-paper-dim/60 border border-paper-dim flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#C1432E_1px,transparent_1px)] [background-size:8px_8px]" />
                <div className="flex items-center gap-1 text-[11px] font-mono text-ink bg-white/90 px-2 py-1 rounded-md shadow-sm z-10">
                  <MapPin className="w-3.5 h-3.5 text-ember animate-bounce" />
                  <span>
                    {order.latitude?.toFixed(4)}, {order.longitude?.toFixed(4)}
                  </span>
                </div>
              </div>

              {order.location_note && (
                <div className="px-2.5 py-1.5 rounded-lg bg-paper border border-paper-dim text-xs text-ink font-medium leading-tight">
                  <span className="text-[10px] font-mono uppercase text-muted block">
                    Outdoor Landmark:
                  </span>
                  {order.location_note}
                </div>
              )}
            </div>
          )}

          {order.order_type === 'pickup' && (
            <div className="px-2.5 py-1.5 rounded-lg bg-paper border border-paper-dim text-xs text-ink font-medium">
              <span className="text-[10px] font-mono uppercase text-muted block">
                Pickup Description:
              </span>
              {order.location_note || 'Customer pickup at counter'}
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div className="flex items-center justify-between text-xs text-muted font-medium pt-1">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-ink" />
            <span className="text-ink font-semibold">{order.customer_name}</span>
          </div>
          {order.customer_phone && (
            <div className="flex items-center gap-1 font-mono text-[11px]">
              <Phone className="w-3 h-3" />
              <span>{order.customer_phone}</span>
            </div>
          )}
        </div>

        {/* Dashed Separator */}
        <div className="border-t border-dashed border-paper-dim my-2" />

        {/* Line Items List */}
        <div className="space-y-2.5">
          {order.order_items.map((item, idx) => (
            <div key={item.id || idx} className="text-xs space-y-0.5">
              <div className="flex items-start justify-between">
                <span className="font-medium text-ink flex items-baseline gap-1.5">
                  <span className="font-mono font-bold text-sm text-ember">
                    {item.quantity}×
                  </span>
                  <span className="text-sm font-semibold">
                    {item.menu_item?.name || 'Menu Item'}
                  </span>
                </span>
                <span className="font-mono text-muted text-[11px]">
                  ${(item.unit_price * item.quantity).toFixed(2)}
                </span>
              </div>

              {/* Modifiers List */}
              {item.selected_modifiers && item.selected_modifiers.length > 0 && (
                <div className="pl-6 space-y-0.5">
                  {item.selected_modifiers.map((mod, mIdx) => (
                    <div
                      key={mIdx}
                      className="text-[11px] font-mono text-muted flex items-center gap-1"
                    >
                      <span className="text-ember">+</span>
                      <span>{mod.name}</span>
                      {mod.price_delta > 0 && (
                        <span>(+${mod.price_delta.toFixed(2)})</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Special Item Kitchen Note in Ember (Section 9.4) */}
              {item.notes && (
                <div className="pl-6 pt-0.5">
                  <p className="text-xs font-mono font-medium text-ember bg-ember/5 px-2 py-0.5 rounded border border-ember/20 inline-block">
                    Note: {item.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Dashed Separator */}
        <div className="border-t border-dashed border-paper-dim my-2" />

        {/* Order Total */}
        <div className="flex items-center justify-between text-xs font-mono font-semibold text-ink pt-1">
          <span>Order Total:</span>
          <span className="text-sm font-bold">${order.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Footer Action Button Matching Column Color (Section 9.4) */}
      {currentAction && (
        <div className="p-3 bg-paper border-t border-paper-dim">
          <button
            onClick={() => onAdvanceStatus(order.id, currentAction.next)}
            disabled={isUpdating}
            className={`w-full py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 ${currentAction.color}`}
          >
            {isUpdating ? (
              <span>Updating...</span>
            ) : (
              <>
                <span>{currentAction.label}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
