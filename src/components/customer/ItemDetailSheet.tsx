'use client';

import React, { useState } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import Image from 'next/image';

export interface MenuItemData {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_count: number | null;
  modifiers: Array<{
    id: string;
    name: string;
    price_delta: number;
    is_required: boolean;
    group_name: string;
  }>;
}

export interface CartModifier {
  name: string;
  price_delta: number;
  group_name: string;
}

export interface CartItem {
  id: string; // unique cart item id (e.g. item.id + modifier hash)
  menu_item_id: string;
  name: string;
  unit_price: number;
  base_price: number;
  quantity: number;
  image_url: string;
  selected_modifiers: CartModifier[];
  notes?: string;
}

interface ItemDetailSheetProps {
  item: MenuItemData | null;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

export default function ItemDetailSheet({
  item,
  onClose,
  onAddToCart,
}: ItemDetailSheetProps) {
  if (!item) return null;

  // Group modifiers by group_name
  const modifierGroups = item.modifiers.reduce((acc, mod) => {
    if (!acc[mod.group_name]) {
      acc[mod.group_name] = [];
    }
    acc[mod.group_name].push(mod);
    return acc;
  }, {} as Record<string, typeof item.modifiers>);

  // Selected state: for required groups, default to first option
  const initialSelected: Record<string, typeof item.modifiers[0]> = {};
  const initialAddons: Record<string, boolean> = {};

  Object.entries(modifierGroups).forEach(([groupName, groupMods]) => {
    const isRequired = groupMods.some((m) => m.is_required);
    if (isRequired && groupMods.length > 0) {
      initialSelected[groupName] = groupMods[0];
    }
  });

  const [selectedRadio, setSelectedRadio] = useState(initialSelected);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<Record<string, boolean>>(initialAddons);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  // Calculate total price for single unit
  let singleUnitPrice = item.price;
  Object.values(selectedRadio).forEach((mod) => {
    if (mod) singleUnitPrice += mod.price_delta;
  });
  item.modifiers.forEach((mod) => {
    if (selectedCheckboxes[mod.id]) {
      singleUnitPrice += mod.price_delta;
    }
  });

  const totalPrice = singleUnitPrice * quantity;

  const handleToggleAddon = (modId: string) => {
    setSelectedCheckboxes((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  const handleSelectRadio = (groupName: string, mod: typeof item.modifiers[0]) => {
    setSelectedRadio((prev) => ({
      ...prev,
      [groupName]: mod,
    }));
  };

  const handleAdd = () => {
    const chosenModifiers: CartModifier[] = [];

    // Add radio selections
    Object.values(selectedRadio).forEach((mod) => {
      if (mod) {
        chosenModifiers.push({
          name: mod.name,
          price_delta: mod.price_delta,
          group_name: mod.group_name,
        });
      }
    });

    // Add checkbox selections
    item.modifiers.forEach((mod) => {
      if (selectedCheckboxes[mod.id]) {
        chosenModifiers.push({
          name: mod.name,
          price_delta: mod.price_delta,
          group_name: mod.group_name,
        });
      }
    });

    const cartId = `${item.id}-${chosenModifiers.map((m) => m.name).sort().join('_')}-${notes.trim()}`;

    onAddToCart({
      id: cartId,
      menu_item_id: item.id,
      name: item.name,
      base_price: item.price,
      unit_price: singleUnitPrice,
      quantity,
      image_url: item.image_url,
      selected_modifiers: chosenModifiers,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/60 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn">
      <div
        className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-paper-dim"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with image */}
        <div className="relative h-56 sm:h-64 w-full bg-paper shrink-0">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 500px"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-ink hover:bg-white shadow-md transition-colors"
            aria-label="Close sheet"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Title & Description */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-serif text-2xl text-ink font-semibold">
                {item.name}
              </h2>
              <span className="font-mono text-xl text-ink font-bold shrink-0">
                ${item.price.toFixed(2)}
              </span>
            </div>
            {/* Full description lives here per Section 5.3 */}
            <p className="text-sm text-muted mt-2 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Modifier Groups */}
          {Object.entries(modifierGroups).map(([groupName, groupMods]) => {
            const isRequired = groupMods.some((m) => m.is_required);

            return (
              <div key={groupName} className="border-t border-paper-dim pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-base font-semibold text-ink">
                    {groupName}
                  </h3>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-paper text-muted uppercase">
                    {isRequired ? 'Required' : 'Optional'}
                  </span>
                </div>

                <div className="space-y-2">
                  {isRequired ? (
                    // Radio selection
                    groupMods.map((mod) => {
                      const isSelected = selectedRadio[groupName]?.id === mod.id;
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => handleSelectRadio(groupName, mod)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm transition-all text-left ${
                            isSelected
                              ? 'border-ink bg-paper font-medium text-ink'
                              : 'border-paper-dim bg-white hover:border-ink/40 text-muted'
                          }`}
                        >
                          <span className="text-ink">{mod.name}</span>
                          <span className="font-mono text-xs">
                            {mod.price_delta > 0
                              ? `+$${mod.price_delta.toFixed(2)}`
                              : mod.price_delta < 0
                              ? `-$${Math.abs(mod.price_delta).toFixed(2)}`
                              : 'Included'}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    // Checkbox selection
                    groupMods.map((mod) => {
                      const isChecked = !!selectedCheckboxes[mod.id];
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => handleToggleAddon(mod.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm transition-all text-left ${
                            isChecked
                              ? 'border-ink bg-paper font-medium text-ink'
                              : 'border-paper-dim bg-white hover:border-ink/40 text-muted'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center ${
                                isChecked
                                  ? 'bg-ink border-ink text-white'
                                  : 'border-muted bg-white'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="text-ink">{mod.name}</span>
                          </div>
                          <span className="font-mono text-xs">
                            {mod.price_delta > 0 ? `+$${mod.price_delta.toFixed(2)}` : 'Free'}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}

          {/* Special Instructions Note */}
          <div className="border-t border-paper-dim pt-4">
            <label className="block font-serif text-sm font-semibold text-ink mb-2">
              Special kitchen note
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. sauce on side, extra napkins"
              className="w-full px-3.5 py-2.5 text-sm bg-paper rounded-xl border border-paper-dim focus:outline-none focus:border-ink text-ink"
            />
          </div>
        </div>

        {/* Footer with Quantity & Add Button */}
        <div className="p-4 bg-paper/60 border-t border-paper-dim flex items-center gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center bg-white border border-paper-dim rounded-xl p-1 shrink-0">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="p-2 text-ink hover:bg-paper rounded-lg disabled:opacity-30"
              aria-label="Decrease quantity"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-mono font-bold text-sm text-ink">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="p-2 text-ink hover:bg-paper rounded-lg"
              aria-label="Increase quantity"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAdd}
            className="flex-1 py-3.5 px-4 bg-ink text-white rounded-xl text-sm font-medium hover:bg-ink/90 active:scale-[0.99] transition-all flex items-center justify-between shadow-md"
          >
            <span>Add to order</span>
            <span className="font-mono font-bold">${totalPrice.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
