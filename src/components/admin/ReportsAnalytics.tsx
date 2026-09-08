'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  CreditCard,
  Calendar,
  Filter,
  Loader2,
  MapPin,
  Utensils,
} from 'lucide-react';

interface Branch {
  id: string;
  name: string;
}

export default function ReportsAnalytics() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadBranches = async () => {
    try {
      const res = await fetch('/api/admin/branches');
      if (res.ok) {
        const d = await res.json();
        setBranches(d.branches || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBranch && selectedBranch !== 'all') params.append('branch_id', selectedBranch);
      if (selectedStatus && selectedStatus !== 'all') params.append('status', selectedStatus);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setReportData(d);
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
    loadReports();
  }, [selectedBranch, selectedStatus, startDate, endDate]);

  const summary = reportData?.summary;
  const orders = reportData?.orders || [];

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-paper-dim shadow-sm space-y-4">
        <div>
          <h2 className="font-serif text-2xl text-ink font-semibold">
            Sales Reports & Order History
          </h2>
          <p className="text-xs text-muted font-mono mt-0.5">
            Full lifetime order records, revenue analytics, and payment methods (Section 7)
          </p>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-paper-dim">
          {/* Branch filter */}
          <div>
            <label className="block text-[11px] font-mono text-muted uppercase mb-1">
              Branch Scope
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-paper rounded-xl border border-paper-dim text-ink font-medium focus:outline-none focus:border-ink"
            >
              <option value="all">All Chain Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-[11px] font-mono text-muted uppercase mb-1">
              Order Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-paper rounded-xl border border-paper-dim text-ink font-medium focus:outline-none focus:border-ink"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="ready">Ready</option>
              <option value="preparing">Preparing</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-mono text-muted uppercase mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-paper rounded-xl border border-paper-dim text-ink font-mono focus:outline-none focus:border-ink"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-mono text-muted uppercase mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-paper rounded-xl border border-paper-dim text-ink font-mono focus:outline-none focus:border-ink"
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-paper-dim shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sage-dim text-sage flex items-center justify-center font-bold">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase text-muted">
                Total Revenue
              </p>
              <h3 className="font-mono text-2xl font-bold text-ink">
                ${summary.totalRevenue.toFixed(2)}
              </h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-paper-dim shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-paper text-ink flex items-center justify-center font-bold">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase text-muted">
                Total Orders Placed
              </p>
              <h3 className="font-mono text-2xl font-bold text-ink">
                {summary.totalOrders}
              </h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-paper-dim shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber/10 text-amber flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-mono uppercase text-muted">
                Average Order Value
              </p>
              <h3 className="font-mono text-2xl font-bold text-ink">
                ${summary.averageOrderValue.toFixed(2)}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Order History Table */}
      {loading ? (
        <div className="py-16 text-center text-muted">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-ember mb-2" />
          <p className="text-xs font-mono">Generating report...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-paper-dim text-muted font-mono text-xs">
          No orders match the selected filters.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-paper-dim shadow-sm overflow-hidden space-y-3">
          <div className="p-4 border-b border-paper-dim flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-ink">
              Order Transactions ({orders.length})
            </h3>
            <span className="text-xs font-mono text-muted">
              Live database queries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-paper border-b border-paper-dim font-mono text-xs text-muted uppercase">
                <tr>
                  <th className="p-3.5">Order ID</th>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Branch</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Location Type</th>
                  <th className="p-3.5">Items</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-dim">
                {orders.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-paper/30 transition-colors font-mono text-xs">
                    <td className="p-3.5 font-bold text-ink">
                      #{ord.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="p-3.5 text-muted">
                      {new Date(ord.created_at).toLocaleString()}
                    </td>
                    <td className="p-3.5 font-sans font-medium text-ink">
                      {ord.branch?.name}
                    </td>
                    <td className="p-3.5 font-sans font-semibold text-ink">
                      {ord.customer_name}
                    </td>
                    <td className="p-3.5 font-sans">
                      {ord.order_type === 'dine_in_table' ? (
                        <span className="inline-flex items-center gap-1 text-sage">
                          <Utensils className="w-3.5 h-3.5" /> {ord.table?.label || 'Table'}
                        </span>
                      ) : ord.order_type === 'outdoor_gps' ? (
                        <span className="inline-flex items-center gap-1 text-ember">
                          <MapPin className="w-3.5 h-3.5" /> Outdoor GPS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted">
                          Pickup
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-sans">
                      {ord.order_items?.map((item: any) => `${item.quantity}x ${item.menu_item?.name}`).join(', ')}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full uppercase font-bold text-[10px] ${
                          ord.status === 'completed'
                            ? 'bg-sage-dim text-sage'
                            : ord.status === 'ready'
                            ? 'bg-sage text-white'
                            : ord.status === 'preparing'
                            ? 'bg-amber text-white'
                            : ord.status === 'received'
                            ? 'bg-paper text-ink'
                            : 'bg-ember/10 text-ember'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-bold text-sm text-ink">
                      ${ord.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
