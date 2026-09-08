'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  History,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface Branch {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  branch_id: string;
  branch: { id: string; name: string };
  name: string;
  unit: string;
  quantity_on_hand: number;
  reorder_threshold: number;
  transactions: Array<{
    id: string;
    change_amount: number;
    reason: 'restock' | 'order_deduction' | 'waste' | 'manual_adjustment';
    created_at: string;
  }>;
}

export default function InventoryManager() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Adjustment Modal
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<'restock' | 'waste' | 'manual_adjustment' | 'order_deduction'>('restock');

  // New Item Modal
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('kg');
  const [newInitialQty, setNewInitialQty] = useState('50');
  const [newThreshold, setNewThreshold] = useState('15');

  const loadBranches = async () => {
    try {
      const res = await fetch('/api/admin/branches');
      if (res.ok) {
        const d = await res.json();
        setBranches(d.branches || []);
        if (d.branches && d.branches.length > 0 && !selectedBranchId) {
          setSelectedBranchId(d.branches[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadInventory = async (branchId: string) => {
    if (!branchId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inventory?branch_id=${branchId}`);
      if (res.ok) {
        const d = await res.json();
        setInventory(d.inventory || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      loadInventory(selectedBranchId);
    }
  }, [selectedBranchId]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAdjust || !adjustAmount) return;

    let delta = Number(adjustAmount);
    if (adjustReason === 'waste' || adjustReason === 'order_deduction') {
      delta = -Math.abs(delta);
    } else if (adjustReason === 'restock') {
      delta = Math.abs(delta);
    }

    await fetch('/api/admin/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inventory_item_id: selectedItemForAdjust.id,
        change_amount: delta,
        reason: adjustReason,
      }),
    });

    setSelectedItemForAdjust(null);
    setAdjustAmount('');
    loadInventory(selectedBranchId);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !selectedBranchId) return;

    await fetch('/api/admin/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branch_id: selectedBranchId,
        name: newName.trim(),
        unit: newUnit.trim(),
        quantity_on_hand: Number(newInitialQty),
        reorder_threshold: Number(newThreshold),
      }),
    });

    setIsCreatingItem(false);
    setNewName('');
    loadInventory(selectedBranchId);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-paper-dim shadow-sm">
        <div>
          <h2 className="font-serif text-2xl text-ink font-semibold">
            Branch Inventory & Stock Control
          </h2>
          <p className="text-xs text-muted font-mono mt-0.5">
            Branch-scoped inventory with restock transactions & reorder threshold alerts (Section 4 & 7)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Selector */}
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="px-3.5 py-2 text-xs font-mono bg-paper border border-paper-dim rounded-xl text-ink font-semibold focus:outline-none focus:border-ink"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                Branch: {b.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsCreatingItem(true)}
            className="px-4 py-2 bg-ink text-white hover:bg-ink/90 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Raw Ingredient
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="py-16 text-center text-muted">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-ember mb-2" />
          <p className="text-xs font-mono">Loading branch stock...</p>
        </div>
      ) : inventory.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-paper-dim text-muted">
          <p>No inventory items registered for this branch yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-paper-dim shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-paper border-b border-paper-dim font-mono text-xs text-muted uppercase">
                <tr>
                  <th className="p-4">Ingredient / Item</th>
                  <th className="p-4">Unit</th>
                  <th className="p-4">Quantity on Hand</th>
                  <th className="p-4">Reorder Threshold</th>
                  <th className="p-4">Stock Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-dim">
                {inventory.map((item) => {
                  const isLow = item.quantity_on_hand <= item.reorder_threshold;

                  return (
                    <tr key={item.id} className="hover:bg-paper/30 transition-colors">
                      <td className="p-4 font-semibold text-ink">
                        {item.name}
                      </td>
                      <td className="p-4 font-mono text-xs text-muted">
                        {item.unit}
                      </td>
                      <td className="p-4 font-mono font-bold text-base text-ink">
                        {item.quantity_on_hand.toFixed(1)} {item.unit}
                      </td>
                      <td className="p-4 font-mono text-xs text-muted">
                        {item.reorder_threshold.toFixed(1)} {item.unit}
                      </td>
                      <td className="p-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 bg-ember/10 text-ember px-2.5 py-1 rounded-full text-xs font-mono font-bold animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-sage-dim text-sage px-2.5 py-1 rounded-full text-xs font-mono font-medium">
                            <CheckCircle className="w-3.5 h-3.5" /> Healthy
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedItemForAdjust(item);
                            setAdjustAmount('10');
                            setAdjustReason('restock');
                          }}
                          className="px-3 py-1.5 bg-paper hover:bg-paper-dim border border-paper-dim rounded-lg text-xs font-mono font-semibold text-ink transition-colors"
                        >
                          Log Adjustment / Restock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Inventory Modal */}
      {selectedItemForAdjust && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-paper-dim">
            <h3 className="font-serif text-xl font-bold text-ink mb-1">
              Stock Adjustment
            </h3>
            <p className="text-xs text-muted font-mono mb-4">
              Item: {selectedItemForAdjust.name} (Current: {selectedItemForAdjust.quantity_on_hand} {selectedItemForAdjust.unit})
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Reason for Transaction *
                </label>
                <select
                  value={adjustReason}
                  onChange={(e: any) => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-paper rounded-xl border border-paper-dim text-ink focus:outline-none focus:border-ink font-medium"
                >
                  <option value="restock">Restock (Received supplier shipment +)</option>
                  <option value="manual_adjustment">Manual Inventory Audit Adjustment (+/-)</option>
                  <option value="waste">Waste / Spoilage / Damage (-)</option>
                  <option value="order_deduction">Batch Kitchen Prep Deduction (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Amount ({selectedItemForAdjust.unit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full px-3.5 py-2 text-sm bg-paper rounded-xl border border-paper-dim font-mono text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedItemForAdjust(null)}
                  className="px-4 py-2 bg-paper text-ink rounded-xl text-xs font-medium hover:bg-paper-dim"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-ink text-white rounded-xl text-xs font-medium hover:bg-ink/90 shadow-md"
                >
                  Commit Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Raw Ingredient Modal */}
      {isCreatingItem && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-paper-dim">
            <h3 className="font-serif text-xl font-bold text-ink mb-4">
              Add Branch Ingredient
            </h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Ingredient Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Extra Virgin Olive Oil"
                  className="w-full px-3.5 py-2 text-sm bg-paper rounded-xl border border-paper-dim text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Unit *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="kg / liters / units"
                    className="w-full px-3 py-2 text-xs bg-paper rounded-xl border border-paper-dim font-mono text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Initial Stock *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newInitialQty}
                    onChange={(e) => setNewInitialQty(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-paper rounded-xl border border-paper-dim font-mono text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Alert Threshold *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-paper rounded-xl border border-paper-dim font-mono text-ink"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
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
                  Save Ingredient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
