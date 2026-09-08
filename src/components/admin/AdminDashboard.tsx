'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  ShoppingBag,
  Package,
  Users,
  MapPin,
  BarChart3,
  LogOut,
  Radio,
  ChevronDown,
} from 'lucide-react';
import TicketRail from '../employee/TicketRail';
import MenuManager from './MenuManager';
import InventoryManager from './InventoryManager';
import StaffManager from './StaffManager';
import BranchManager from './BranchManager';
import ReportsAnalytics from './ReportsAnalytics';

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  branch_id?: string | null;
  branch?: { id: string; name: string } | null;
}

interface AdminDashboardProps {
  user: UserSession;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    'tickets' | 'menu' | 'inventory' | 'staff' | 'branches' | 'reports'
  >('tickets');

  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await fetch('/api/admin/branches');
        if (res.ok) {
          const d = await res.json();
          setBranches(d.branches || []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadBranches();
  }, []);

  const navItems = [
    { id: 'tickets', label: 'Live Ticket Rail', icon: Radio },
    { id: 'menu', label: 'Menu Catalog', icon: Layers },
    { id: 'inventory', label: 'Branch Inventory', icon: Package },
    { id: 'staff', label: 'Staff & Roles', icon: Users },
    { id: 'branches', label: 'Locations & Tables', icon: MapPin },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-paper flex flex-col font-sans">
      {/* Top Admin Navigation Header */}
      <header className="bg-ink text-white px-6 py-3.5 border-b border-black/20 flex flex-wrap items-center justify-between gap-4 shadow-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-ember flex items-center justify-center font-serif font-bold text-white shadow-sm">
            A
          </div>
          <div>
            <h1 className="font-serif text-lg font-bold tracking-wide">
              Management Portal
            </h1>
            <p className="text-[10px] font-mono text-paper-dim/70 uppercase">
              Full Administrator Suite
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-ink font-bold shadow-sm'
                    : 'text-paper-dim hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right User & Logout */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold leading-tight">{user.name}</p>
            <p className="text-[10px] font-mono text-paper-dim/70 uppercase">
              {user.role}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg bg-ember/90 hover:bg-ember text-white transition-colors flex items-center gap-1 text-xs font-mono"
            title="Logout admin session"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
        {activeTab === 'tickets' && (
          <div className="space-y-4">
            {/* Branch Switcher for Ticket Rail per Section 7 */}
            <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-paper-dim shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted uppercase font-bold">
                  Viewing Branch Queue:
                </span>
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-mono bg-paper border border-paper-dim rounded-lg text-ink font-bold focus:outline-none focus:border-ink"
                >
                  <option value="all">All Branches Live Feed</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-xs font-mono text-muted hidden sm:inline">
                Real-time WebSocket active
              </span>
            </div>

            <div className="-mx-4 sm:mx-0">
              <TicketRail
                user={user}
                onLogout={onLogout}
                branchOverrideId={selectedBranchId !== 'all' ? selectedBranchId : undefined}
              />
            </div>
          </div>
        )}

        {activeTab === 'menu' && <MenuManager />}
        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'staff' && <StaffManager />}
        {activeTab === 'branches' && <BranchManager />}
        {activeTab === 'reports' && <ReportsAnalytics />}
      </main>
    </div>
  );
}
