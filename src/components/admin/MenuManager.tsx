'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from 'lucide-react';

interface MenuCategory {
  id: string;
  name: string;
  sort_order: number;
}

interface Modifier {
  id?: string;
  name: string;
  price_delta: number;
  is_required: boolean;
  group_name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  category_id: string;
  category?: { id: string; name: string };
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  modifiers: Modifier[];
  branch_menu_items: Array<{
    id: string;
    branch_id: string;
    is_available: boolean;
    stock_count: number | null;
    branch: { id: string; name: string };
  }>;
}

export default function MenuManager() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Edit / Create Modal state
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatOrder, setNewCatOrder] = useState(0);

  // Item form state
  const [formCategory, setFormCategory] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formModifiers, setFormModifiers] = useState<Modifier[]>([]);

  // Modifier input row
  const [modName, setModName] = useState('');
  const [modPrice, setModPrice] = useState('');
  const [modGroup, setModGroup] = useState('Add-ons');
  const [modRequired, setModRequired] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, itemRes, branchRes] = await Promise.all([
        fetch('/api/admin/menu/categories'),
        fetch('/api/admin/menu/items'),
        fetch('/api/admin/branches'),
      ]);

      if (catRes.ok) {
        const d = await catRes.json();
        setCategories(d.categories || []);
      }
      if (itemRes.ok) {
        const d = await itemRes.json();
        setItems(d.items || []);
      }
      if (branchRes.ok) {
        const d = await branchRes.json();
        setBranches(d.branches || []);
      }
    } catch (e) {
      console.error('Error loading menu admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateItem = () => {
    setEditingItem(null);
    setFormCategory(categories[0]?.id || '');
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormImageUrl('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80');
    setFormModifiers([]);
    setIsCreatingItem(true);
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormCategory(item.category_id);
    setFormName(item.name);
    setFormDescription(item.description);
    setFormPrice(item.price.toString());
    setFormImageUrl(item.image_url);
    setFormModifiers(
      item.modifiers.map((m) => ({
        name: m.name,
        price_delta: m.price_delta,
        is_required: m.is_required,
        group_name: m.group_name,
      }))
    );
    setIsCreatingItem(true);
  };

  const handleAddModifierToForm = () => {
    if (!modName.trim()) return;
    setFormModifiers([
      ...formModifiers,
      {
        name: modName.trim(),
        price_delta: Number(modPrice) || 0,
        group_name: modGroup.trim() || 'General',
        is_required: modRequired,
      },
    ]);
    setModName('');
    setModPrice('');
  };

  const handleRemoveModifierFromForm = (idx: number) => {
    setFormModifiers(formModifiers.filter((_, i) => i !== idx));
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      category_id: formCategory,
      name: formName,
      description: formDescription,
      price: Number(formPrice),
      image_url: formImageUrl,
      modifiers: formModifiers,
    };

    if (editingItem) {
      // Update item
      await fetch(`/api/admin/menu/items/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      // Create new shared item
      await fetch('/api/admin/menu/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    setIsCreatingItem(false);
    loadData();
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    await fetch(`/api/admin/menu/items/${id}`, { method: 'DELETE' });
    loadData();
  };

  const handleToggleBranchAvailability = async (
    branchId: string,
    menuItemId: string,
    currentVal: boolean
  ) => {
    await fetch('/api/admin/menu/branch-availability', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branch_id: branchId,
        menu_item_id: menuItemId,
        is_available: !currentVal,
      }),
    });
    loadData();
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await fetch('/api/admin/menu/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCatName, sort_order: Number(newCatOrder) }),
    });
    setNewCatName('');
    setIsCreatingCategory(false);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-paper-dim shadow-sm">
        <div>
          <h2 className="font-serif text-2xl text-ink font-semibold">
            Menu & Availability Management
          </h2>
          <p className="text-xs text-muted font-mono mt-0.5">
            Single shared menu catalog with per-branch stock overrides (Section 4 & 7)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Filter for overrides view */}
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="px-3.5 py-2 text-xs font-mono bg-paper border border-paper-dim rounded-xl text-ink focus:outline-none focus:border-ink"
          >
            <option value="all">Global Catalog (All Branches)</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                Branch: {b.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsCreatingCategory(true)}
            className="px-4 py-2 bg-paper text-ink hover:bg-paper-dim border border-paper-dim rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" /> + Category
          </button>

          <button
            onClick={openCreateItem}
            className="px-4 py-2 bg-ink text-white hover:bg-ink/90 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Menu Item
          </button>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="px-3.5 py-1.5 bg-white border border-paper-dim rounded-lg text-xs font-mono flex items-center gap-2"
          >
            <span className="font-bold text-ink">{cat.name}</span>
            <span className="text-[10px] text-muted">Order: {cat.sort_order}</span>
          </div>
        ))}
      </div>

      {/* Items Table / Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-muted">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-ember mb-2" />
          <p className="text-xs font-mono">Loading menu items...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            // Find branch availability
            const currentBranchOverride =
              selectedBranchId !== 'all'
                ? item.branch_menu_items.find((b) => b.branch_id === selectedBranchId)
                : null;
            const isBranchAvailable = currentBranchOverride
              ? currentBranchOverride.is_available
              : item.is_available;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-paper-dim shadow-sm flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-paper shrink-0">
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-mono text-muted uppercase tracking-wider block">
                        {item.category?.name || 'Category'}
                      </span>
                      <h3 className="font-serif text-base font-semibold text-ink truncate">
                        {item.name}
                      </h3>
                      <span className="font-mono text-sm font-bold text-ink">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Modifiers count */}
                  <div className="mt-2 text-[11px] font-mono text-muted">
                    {item.modifiers.length} modifiers attached
                  </div>
                </div>

                {/* Per-branch Availability Toggle / Actions */}
                <div className="pt-3 border-t border-paper-dim flex items-center justify-between">
                  {selectedBranchId !== 'all' ? (
                    <button
                      onClick={() =>
                        handleToggleBranchAvailability(
                          selectedBranchId,
                          item.id,
                          isBranchAvailable
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
                        isBranchAvailable
                          ? 'bg-sage-dim text-sage'
                          : 'bg-ember/10 text-ember'
                      }`}
                    >
                      {isBranchAvailable ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> In Stock & Active
                        </>
                      ) : (
                        <>
                          <X className="w-3.5 h-3.5" /> Out of Stock (Disabled)
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-xs font-mono text-muted">
                      Shared across all branches
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditItem(item)}
                      className="p-1.5 text-muted hover:text-ink hover:bg-paper rounded-lg transition-colors"
                      title="Edit Item"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-muted hover:text-ember hover:bg-ember/10 rounded-lg transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Item Modal */}
      {isCreatingItem && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-paper-dim">
            <div className="p-5 border-b border-paper-dim flex items-center justify-between bg-paper/50">
              <h3 className="font-serif text-xl font-bold text-ink">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
              <button
                onClick={() => setIsCreatingItem(false)}
                className="p-1.5 rounded-lg hover:bg-paper-dim text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-paper rounded-xl border border-paper-dim text-ink focus:outline-none focus:border-ink"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="24.50"
                    className="w-full px-3.5 py-2 text-sm bg-paper rounded-xl border border-paper-dim font-mono text-ink focus:outline-none focus:border-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Truffle Butter Ribeye"
                  className="w-full px-3.5 py-2 text-sm bg-paper rounded-xl border border-paper-dim text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Full Description (Shown in item sheet per Section 5.3) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detailed description of ingredients, cuts, cooking methods..."
                  className="w-full px-3.5 py-2 text-sm bg-paper rounded-xl border border-paper-dim text-ink focus:outline-none focus:border-ink resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Image URL (High-res photo) *
                </label>
                <input
                  type="url"
                  required
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-2 text-sm bg-paper rounded-xl border border-paper-dim text-ink focus:outline-none focus:border-ink"
                />
              </div>

              {/* Modifiers Manager Section */}
              <div className="border-t border-paper-dim pt-4">
                <h4 className="font-serif text-sm font-semibold text-ink mb-2">
                  Modifiers & Add-ons
                </h4>

                {/* Modifiers List */}
                <div className="space-y-2 mb-3">
                  {formModifiers.map((mod, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-paper rounded-lg flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <span className="font-bold text-ink">{mod.name}</span>
                        <span className="text-muted ml-2">({mod.group_name})</span>
                        <span className="text-ember ml-2">
                          {mod.price_delta >= 0
                            ? `+$${mod.price_delta.toFixed(2)}`
                            : `-$${Math.abs(mod.price_delta).toFixed(2)}`}
                        </span>
                        {mod.is_required && (
                          <span className="ml-2 text-[10px] bg-ink text-white px-1 rounded">
                            Required
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveModifierFromForm(i)}
                        className="text-muted hover:text-ember"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Modifier inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-paper/50 p-3 rounded-xl border border-paper-dim">
                  <input
                    type="text"
                    placeholder="Modifier Name"
                    value={modName}
                    onChange={(e) => setModName(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white rounded border border-paper-dim text-ink"
                  />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Price Delta ($)"
                    value={modPrice}
                    onChange={(e) => setModPrice(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white rounded border border-paper-dim font-mono text-ink"
                  />
                  <input
                    type="text"
                    placeholder="Group (e.g. Size)"
                    value={modGroup}
                    onChange={(e) => setModGroup(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white rounded border border-paper-dim text-ink"
                  />
                  <button
                    type="button"
                    onClick={handleAddModifierToForm}
                    className="px-3 py-1.5 bg-ink text-white rounded text-xs font-medium hover:bg-ink/90"
                  >
                    + Add Mod
                  </button>
                </div>
              </div>

              {/* Submit / Cancel */}
              <div className="pt-4 border-t border-paper-dim flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingItem(false)}
                  className="px-4 py-2 bg-paper text-ink rounded-xl text-xs font-medium hover:bg-paper-dim"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-ink text-white rounded-xl text-xs font-medium hover:bg-ink/90 shadow-md"
                >
                  Save Menu Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {isCreatingCategory && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-paper-dim">
            <h3 className="font-serif text-xl font-bold text-ink mb-4">
              Add Menu Category
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Artisan Desserts"
                  className="w-full px-3.5 py-2 text-sm bg-paper rounded-xl border border-paper-dim text-ink focus:outline-none focus:border-ink"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={newCatOrder}
                  onChange={(e) => setNewCatOrder(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm bg-paper rounded-xl border border-paper-dim font-mono text-ink focus:outline-none focus:border-ink"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(false)}
                  className="px-4 py-2 bg-paper text-ink rounded-xl text-xs font-medium hover:bg-paper-dim"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-ink text-white rounded-xl text-xs font-medium hover:bg-ink/90"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
