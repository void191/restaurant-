'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Phone,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Utensils,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';

interface Table {
  id: string;
  label: string;
  is_active: boolean;
}

interface Branch {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  opening_hours: Record<string, string>;
  is_active: boolean;
  tables: Table[];
}

export default function BranchManager() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected branch for table management
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);

  // Modals
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [isEditingBranch, setIsEditingBranch] = useState<Branch | null>(null);
  const [newTableName, setNewTableName] = useState('');

  // Form State
  const [bName, setBName] = useState('');
  const [bAddress, setBAddress] = useState('');
  const [bLat, setBLat] = useState('');
  const [bLng, setBLng] = useState('');
  const [bPhone, setBPhone] = useState('');

  const loadBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/branches');
      if (res.ok) {
        const d = await res.json();
        setBranches(d.branches || []);
        if (d.branches?.length > 0) {
          setActiveBranch((prev) =>
            prev ? d.branches.find((b: Branch) => b.id === prev.id) || d.branches[0] : d.branches[0]
          );
        }
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

  const openCreateModal = () => {
    setIsEditingBranch(null);
    setBName('');
    setBAddress('');
    setBLat('37.7749');
    setBLng('-122.4194');
    setBPhone('(415) 555-0100');
    setIsCreatingBranch(true);
  };

  const openEditModal = (b: Branch) => {
    setIsEditingBranch(b);
    setBName(b.name);
    setBAddress(b.address);
    setBLat(b.latitude.toString());
    setBLng(b.longitude.toString());
    setBPhone(b.phone);
    setIsCreatingBranch(true);
  };

  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: bName.trim(),
      address: bAddress.trim(),
      latitude: Number(bLat),
      longitude: Number(bLng),
      phone: bPhone.trim(),
    };

    if (isEditingBranch) {
      await fetch(`/api/admin/branches/${isEditingBranch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/admin/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    setIsCreatingBranch(false);
    loadBranches();
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBranch || !newTableName.trim()) return;

    await fetch(`/api/admin/branches/${activeBranch.id}/tables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newTableName.trim() }),
    });

    setNewTableName('');
    loadBranches();
  };

  const handleToggleTable = async (table: Table) => {
    if (!activeBranch) return;
    await fetch(`/api/admin/branches/${activeBranch.id}/tables`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_id: table.id,
        is_active: !table.is_active,
      }),
    });
    loadBranches();
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!activeBranch) return;
    if (!confirm('Are you sure you want to delete this table?')) return;

    await fetch(`/api/admin/branches/${activeBranch.id}/tables?table_id=${tableId}`, {
      method: 'DELETE',
    });
    loadBranches();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-paper-dim shadow-sm">
        <div>
          <h2 className="font-serif text-2xl text-ink font-semibold">
            Branch Locations & Dining Tables
          </h2>
          <p className="text-xs text-muted font-mono mt-0.5">
            Configure chain restaurant branches, geographic coordinates, and active tables (Section 4 & 7)
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-ink text-white hover:bg-ink/90 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Branch
        </button>
      </div>

      {/* Main Grid: Branches on left, Tables of selected branch on right */}
      {loading ? (
        <div className="py-16 text-center text-muted">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-ember mb-2" />
          <p className="text-xs font-mono">Loading branches...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Branches List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="font-serif text-lg font-bold text-ink">
              All Branches ({branches.length})
            </h3>
            <div className="space-y-3">
              {branches.map((b) => {
                const isSelected = activeBranch?.id === b.id;

                return (
                  <div
                    key={b.id}
                    onClick={() => setActiveBranch(b)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-ink ring-2 ring-ink/10 shadow-md'
                        : 'bg-white/70 border-paper-dim hover:border-ink/40'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-serif text-base font-bold text-ink">
                          {b.name}
                        </h4>
                        <p className="text-xs text-muted flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-ember shrink-0" />
                          {b.address}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(b);
                        }}
                        className="p-1.5 rounded-lg hover:bg-paper text-muted hover:text-ink"
                        title="Edit branch details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-muted mt-3 pt-2 border-t border-paper-dim">
                      <span>{b.phone}</span>
                      <span className="font-bold text-ink">
                        {b.tables?.length || 0} Tables
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table Management of Selected Branch */}
          <div className="lg:col-span-2 space-y-4">
            {activeBranch ? (
              <div className="bg-white p-6 rounded-2xl border border-paper-dim shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-paper-dim pb-4">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-muted">
                      TABLE CONFIGURATION
                    </span>
                    <h3 className="font-serif text-2xl text-ink font-bold">
                      {activeBranch.name} Tables
                    </h3>
                  </div>

                  {/* Add Table form */}
                  <form onSubmit={handleAddTable} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Patio 3, Table 6"
                      value={newTableName}
                      onChange={(e) => setNewTableName(e.target.value)}
                      className="px-3 py-1.5 text-xs bg-paper rounded-lg border border-paper-dim text-ink focus:outline-none focus:border-ink"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-ink text-white rounded-lg text-xs font-medium hover:bg-ink/90 flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Table
                    </button>
                  </form>
                </div>

                {/* Table Chips Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {activeBranch.tables?.map((tbl) => (
                    <div
                      key={tbl.id}
                      className={`p-3 rounded-xl border flex flex-col justify-between space-y-2 transition-all ${
                        tbl.is_active
                          ? 'bg-paper/50 border-paper-dim'
                          : 'bg-paper/20 border-paper-dim opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-ink">
                          {tbl.label}
                        </span>
                        <button
                          onClick={() => handleDeleteTable(tbl.id)}
                          className="text-muted hover:text-ember"
                          title="Delete Table"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleToggleTable(tbl)}
                        className={`text-[11px] font-mono py-1 px-2 rounded text-center transition-colors ${
                          tbl.is_active
                            ? 'bg-sage-dim text-sage font-bold'
                            : 'bg-paper text-muted'
                        }`}
                      >
                        {tbl.is_active ? '● Active' : '○ Inactive'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 text-center rounded-2xl border border-paper-dim text-muted">
                Select a branch to manage its tables.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Branch Modal */}
      {isCreatingBranch && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-paper-dim">
            <h3 className="font-serif text-xl font-bold text-ink mb-4">
              {isEditingBranch ? 'Edit Branch' : 'Add New Branch'}
            </h3>
            <form onSubmit={handleBranchSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  required
                  value={bName}
                  onChange={(e) => setBName(e.target.value)}
                  placeholder="e.g. Downtown Flagship"
                  className="w-full px-3.5 py-2 text-sm bg-paper rounded-xl border border-paper-dim text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={bAddress}
                  onChange={(e) => setBAddress(e.target.value)}
                  placeholder="e.g. 142 Market Street, Financial District"
                  className="w-full px-3.5 py-2 text-sm bg-paper rounded-xl border border-paper-dim text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Latitude *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={bLat}
                    onChange={(e) => setBLat(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-paper rounded-xl border border-paper-dim font-mono text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Longitude *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={bLng}
                    onChange={(e) => setBLng(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-paper rounded-xl border border-paper-dim font-mono text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={bPhone}
                  onChange={(e) => setBPhone(e.target.value)}
                  placeholder="(415) 555-0142"
                  className="w-full px-3.5 py-2 text-sm bg-paper rounded-xl border border-paper-dim font-mono text-ink"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingBranch(false)}
                  className="px-4 py-2 bg-paper text-ink rounded-xl text-xs font-medium hover:bg-paper-dim"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-ink text-white rounded-xl text-xs font-medium hover:bg-ink/90 shadow-md"
                >
                  {isEditingBranch ? 'Save Changes' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
