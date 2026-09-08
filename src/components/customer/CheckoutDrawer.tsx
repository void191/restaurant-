'use client';

import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ArrowRight, Loader2, MapPin, Utensils } from 'lucide-react';
import { CartItem } from './ItemDetailSheet';
import { LocationData } from './LocationCapture';
import { Branch } from './BranchSelect';

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  branch: Branch;
  locationData: LocationData;
  onUpdateQuantity: (cartId: string, delta: number) => void;
  onRemoveItem: (cartId: string) => void;
  onOrderSuccess: (order: any) => void;
}

export default function CheckoutDrawer({
  isOpen,
  onClose,
  cart,
  branch,
  locationData,
  onUpdateQuantity,
  onRemoveItem,
  onOrderSuccess,
}: CheckoutDrawerProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );
  const total = subtotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMessage('Please provide your name for the order.');
      return;
    }

    if (cart.length === 0) {
      setErrorMessage('Your cart is empty.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Combine general order note with location note if present
      let combinedLocationNote = locationData.location_note || '';
      if (orderNote.trim()) {
        combinedLocationNote = combinedLocationNote
          ? `${combinedLocationNote} | Order Note: ${orderNote.trim()}`
          : orderNote.trim();
      }

      const payload = {
        branch_id: branch.id,
        order_type: locationData.order_type,
        table_id: locationData.table_id,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        location_note: combinedLocationNote || null,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        items: cart.map((item) => ({
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          selected_modifiers: item.selected_modifiers,
          notes: item.notes || null,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit order');
      }

      onOrderSuccess(data.order);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong while placing order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/60 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn">
      <div
        className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-paper-dim"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-paper-dim flex items-center justify-between bg-paper/50">
          <div>
            <h2 className="font-serif text-2xl text-ink font-semibold">
              Your Order
            </h2>
            <p className="text-xs font-mono text-muted mt-0.5">
              {branch.name} · {locationData.display_summary}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-paper-dim text-ink transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Cart Content & Checkout Form */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {/* Cart Items List */}
          <div className="space-y-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-paper-dim bg-white shadow-sm flex items-start justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="font-serif text-base font-semibold text-ink">
                      {item.name}
                    </h3>
                    <span className="font-mono text-sm font-bold text-ink ml-2">
                      ${(item.unit_price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  {/* Modifiers line */}
                  {item.selected_modifiers.length > 0 && (
                    <div className="text-xs font-mono text-muted mt-1 space-x-1">
                      {item.selected_modifiers.map((m, i) => (
                        <span key={i} className="inline-block bg-paper px-1.5 py-0.5 rounded text-[11px]">
                          +{m.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-xs text-ember italic mt-1">
                      &quot;{item.notes}&quot;
                    </p>
                  )}

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center border border-paper-dim rounded-lg bg-paper">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="p-1.5 text-ink hover:bg-paper-dim rounded-l-lg"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-7 text-center font-mono text-xs font-bold text-ink">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="p-1.5 text-ink hover:bg-paper-dim rounded-r-lg"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-xs text-muted hover:text-ember flex items-center gap-1 font-mono transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Location Summary Reminder (Section 5.4: location data attached, not re-asked) */}
          <div className="p-3.5 rounded-xl bg-paper border border-paper-dim flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {locationData.order_type === 'dine_in_table' ? (
                <div className="p-2 rounded-lg bg-sage-dim text-sage">
                  <Utensils className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-ember/10 text-ember">
                  <MapPin className="w-4 h-4" />
                </div>
              )}
              <div>
                <p className="text-xs font-mono uppercase text-muted font-bold">
                  Order Location
                </p>
                <p className="text-sm font-semibold text-ink">
                  {locationData.display_summary}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Details Form (Section 5.4) */}
          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="block font-serif text-sm font-semibold text-ink mb-1.5">
                Your Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="w-full px-3.5 py-2.5 text-sm bg-paper rounded-xl border border-paper-dim focus:outline-none focus:border-ink text-ink font-medium"
              />
            </div>

            <div>
              <label className="block font-serif text-sm font-semibold text-ink mb-1.5">
                Phone Number (optional, for SMS updates)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="(555) 000-0000"
                className="w-full px-3.5 py-2.5 text-sm bg-paper rounded-xl border border-paper-dim focus:outline-none focus:border-ink text-ink font-mono"
              />
            </div>

            <div>
              <label className="block font-serif text-sm font-semibold text-ink mb-1.5">
                General Order Note (optional)
              </label>
              <input
                type="text"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="e.g. Please bring extra water glasses"
                className="w-full px-3.5 py-2.5 text-sm bg-paper rounded-xl border border-paper-dim focus:outline-none focus:border-ink text-ink"
              />
            </div>

            {errorMessage && (
              <div className="p-3 bg-ember/10 border border-ember/20 rounded-xl text-xs text-ember font-medium">
                {errorMessage}
              </div>
            )}
          </form>
        </div>

        {/* Footer with Totals & Submit */}
        <div className="p-4 sm:p-5 bg-paper/80 border-t border-paper-dim space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-muted">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-base font-mono font-bold text-ink">
            <span>Total</span>
            <span className="text-xl">${total.toFixed(2)}</span>
          </div>

          <button
            type="submit"
            form="checkout-form"
            disabled={isSubmitting || cart.length === 0}
            className="w-full py-4 px-5 bg-ink text-white rounded-xl text-sm font-medium hover:bg-ink/90 active:scale-[0.99] transition-all flex items-center justify-between shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2 mx-auto">
                <Loader2 className="w-5 h-5 animate-spin" /> Submitting order...
              </span>
            ) : (
              <>
                <span className="font-semibold tracking-wide">Place Order</span>
                <span className="flex items-center gap-1 font-mono font-bold text-base">
                  ${total.toFixed(2)} <ArrowRight className="w-4 h-4 ml-1" />
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
