'use client';

import React from 'react';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { CartItem } from './ItemDetailSheet';

interface CartBarProps {
  cart: CartItem[];
  onOpenCart: () => void;
}

export default function CartBar({ cart, onOpenCart }: CartBarProps) {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 px-4 z-30 pointer-events-none animate-slideUp">
      <div className="max-w-xl mx-auto pointer-events-auto">
        <button
          onClick={onOpenCart}
          className="w-full bg-ink text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between hover:bg-ink/90 active:scale-[0.99] transition-all border border-white/10"
        >
          {/* Left: item count with ember badge per Section 9.3 */}
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-ember text-white font-mono text-xs font-bold flex items-center justify-center shadow-sm">
              {totalItems}
            </span>
            <div className="text-left">
              <span className="font-serif text-sm font-semibold tracking-wide">
                View Order
              </span>
              <p className="text-[11px] text-paper-dim/80 font-mono">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} ready
              </p>
            </div>
          </div>

          {/* Right: Running total & arrow per Section 9.3 */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-bold text-white">
              ${totalPrice.toFixed(2)}
            </span>
            <div className="p-1 rounded-full bg-white/10">
              <ChevronRight className="w-4 h-4 text-white" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
