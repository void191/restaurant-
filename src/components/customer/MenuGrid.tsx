'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Plus, MapPin, Sparkles } from 'lucide-react';
import { MenuItemData, CartItem } from './ItemDetailSheet';
import { LocationData } from './LocationCapture';
import { Branch } from './BranchSelect';

export interface MenuCategoryData {
  id: string;
  name: string;
  sort_order: number;
  items: MenuItemData[];
}

interface MenuGridProps {
  branch: Branch;
  locationData: LocationData;
  categories: MenuCategoryData[];
  onChangeLocation: () => void;
  onOpenItemDetail: (item: MenuItemData) => void;
  onQuickAdd: (item: MenuItemData) => void;
}

export default function MenuGrid({
  branch,
  locationData,
  categories,
  onChangeLocation,
  onOpenItemDetail,
  onQuickAdd,
}: MenuGridProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    categories[0]?.id || ''
  );
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (categories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  const activeCategory = categories.find((c) => c.id === activeCategoryId) || categories[0];

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-32">
      {/* Top Bar with Location Pill per Section 9.3 */}
      <div className="flex items-center justify-between gap-3 mb-6 bg-white p-3 rounded-2xl border border-paper-dim shadow-sm">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-paper flex items-center justify-center shrink-0">
            <span className="font-serif text-sm font-bold text-ink">
              {branch.name.charAt(0)}
            </span>
          </div>
          <div className="truncate">
            <p className="text-xs text-muted truncate font-mono">{branch.name}</p>
            {/* Location Pill per Section 9.3 */}
            <span className="inline-flex items-center text-xs font-mono font-semibold text-ink">
              {locationData.display_summary}
            </span>
          </div>
        </div>

        <button
          onClick={onChangeLocation}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink bg-paper hover:bg-paper-dim border border-paper-dim transition-colors shrink-0"
        >
          Change
        </button>
      </div>

      {/* Brand Header */}
      <div className="mb-6">
        <p className="text-[11px] uppercase font-mono tracking-widest text-muted">
          Seasonal Daily Service
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl text-ink font-semibold mt-0.5">
          {branch.name}
        </h1>
      </div>

      {/* Horizontal Category Tabs (Section 5.3) */}
      <div
        ref={tabsContainerRef}
        className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-3 mb-6 border-b border-paper-dim sticky top-0 bg-paper/95 backdrop-blur-md z-10 py-2"
      >
        {categories.map((cat) => {
          const isActive = cat.id === (activeCategory?.id || categories[0]?.id);
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-ink text-white shadow-sm font-semibold'
                  : 'bg-white text-muted hover:text-ink hover:bg-paper-dim border border-paper-dim'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Menu Grid per Section 9.3 */}
      {activeCategory && activeCategory.items.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl text-ink font-semibold">
              {activeCategory.name}
            </h2>
            <span className="text-xs font-mono text-muted">
              {activeCategory.items.length} items
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
            {activeCategory.items.map((item, idx) => {
              // The first/featured item of a category may render as a full-width hero card per Section 9.3
              const isHero = idx === 0 && activeCategory.items.length > 1;

              return (
                <div
                  key={item.id}
                  className={`group bg-white rounded-2xl overflow-hidden border border-paper-dim hover:border-ink/40 transition-all duration-200 shadow-sm flex flex-col ${
                    isHero ? 'col-span-2' : 'col-span-1'
                  }`}
                >
                  {/* Photo Container */}
                  <div
                    onClick={() => onOpenItemDetail(item)}
                    className={`relative w-full cursor-pointer bg-paper overflow-hidden ${
                      isHero ? 'aspect-[16/9] sm:aspect-[21/9]' : 'aspect-square'
                    }`}
                  >
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      sizes={
                        isHero
                          ? '(max-width: 768px) 100vw, 800px'
                          : '(max-width: 768px) 50vw, 400px'
                      }
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {isHero && (
                      <div className="absolute top-3 left-3 bg-ink/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[11px] font-mono flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber" /> Chef’s Selection
                      </div>
                    )}

                    {/* Circular "+" quick-add button sits directly on photo per Section 9.3 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickAdd(item);
                      }}
                      className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white text-ink shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform border border-black/5"
                      aria-label={`Quick add ${item.name}`}
                    >
                      <Plus className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* Card Content per Section 9.3: Only item name, size/portion label, price (no paragraph descriptions) */}
                  <div
                    onClick={() => onOpenItemDetail(item)}
                    className="p-3 sm:p-4 cursor-pointer flex-1 flex flex-col justify-between"
                  >
                    <div>
                      <h3 className="font-serif text-base sm:text-lg text-ink font-semibold line-clamp-1 group-hover:text-ember transition-colors">
                        {item.name}
                      </h3>
                      {item.modifiers.length > 0 && (
                        <p className="text-[11px] font-mono text-muted uppercase mt-0.5">
                          Customizable
                        </p>
                      )}
                    </div>

                    <div className="mt-2 pt-2 flex items-center justify-between border-t border-paper-dim">
                      <span className="font-mono text-sm sm:text-base font-bold text-ink">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-muted">
          <p>No available items in this category for this branch.</p>
        </div>
      )}
    </div>
  );
}
