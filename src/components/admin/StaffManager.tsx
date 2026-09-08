'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, UserX, Plus, Shield, Briefcase, Loader2, Key } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
}

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'employee' | 'admin';
  branch_id: string | null;
  is_active: boolean;
  branch: { id: string; name: string } | null;
  created_at: string;
}

export default function StaffManager() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'employee' | 'admin'>('employee');
  const [branchId, setBranchId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [staffRes, branchRes] = await Promise.all([
        fetch('/api/admin/staff'),
        fetch('/api/admin/branches'),
      ]);

      if (staffRes.ok) {
        const d = await staffRes.json();
        setUsers(d.users || []);
      }
      if (branchRes.ok) {
        const d = await branchRes.json();
        setBranches(d.branches || []);
        if (d.branches?.length > 0 && !branchId) {
          setBranchId(d.branches[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleActive = async (user: StaffUser) => {
    const nextState = !user.is_active;
    await fetch(`/api/admin/staff/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: nextState }),
    });
    loadData();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;

    const res = await fetch('/api/admin/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        role,
        branch_id: role === 'employee' ? branchId : branchId || null,
      }),
    });

    if (res.ok) {
      setIsCreating(false);
      setName('');
      setEmail('');
      setPassword('');
      loadData();
    } else {
      const err = await res.json();
      alert(err.error || 'Failed to create user');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-paper-dim shadow-sm">
        <div>
          <h2 className="font-serif text-2xl text-ink font-semibold">
            Staff & Access Control
          </h2>
          <p className="text-xs text-muted font-mono mt-0.5">
            Manage employee and administrator accounts, assigned branches, and role permissions (Section 2 & 7)
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-ink text-white hover:bg-ink/90 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Staff Account
        </button>
      </div>

      {/* Staff Table */}
      {loading ? (
        <div className="py-16 text-center text-muted">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-ember mb-2" />
          <p className="text-xs font-mono">Loading staff accounts...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-paper-dim shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-paper border-b border-paper-dim font-mono text-xs text-muted uppercase">
                <tr>
                  <th className="p-4">Staff Member</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Assigned Branch</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-dim">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-paper/30 transition-colors">
                    <td className="p-4 font-semibold text-ink">
                      {u.name}
                    </td>
                    <td className="p-4 font-mono text-xs text-muted">
                      {u.email}
                    </td>
                    <td className="p-4">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 bg-ink text-white px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
                          <Shield className="w-3 h-3 text-amber" /> Administrator
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-paper text-ink px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border border-paper-dim">
                          <Briefcase className="w-3 h-3 text-muted" /> Counter Employee
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-xs text-ink font-medium">
                      {u.branch?.name || (u.role === 'admin' ? 'All Branches (Unscoped)' : 'None')}
                    </td>
                    <td className="p-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 bg-sage-dim text-sage px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
                          <UserCheck className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-ember/10 text-ember px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
                          <UserX className="w-3 h-3" /> Deactivated
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors border ${
                          u.is_active
                            ? 'bg-paper text-muted hover:text-ember hover:border-ember/30 border-paper-dim'
                            : 'bg-sage-dim text-sage border-sage/30 hover:bg-sage hover:text-white'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Staff Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-paper-dim">
            <h3 className="font-serif text-xl font-bold text-ink mb-4">
              Create Staff Account
            </h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Miller"
                  className="w-full px-3.5 py-2 text-sm bg-paper rounded-xl border border-paper-dim text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jordan@restaurant.com"
                  className="w-full px-3.5 py-2 text-sm bg-paper rounded-xl border border-paper-dim font-mono text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Initial Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 text-sm bg-paper rounded-xl border border-paper-dim font-mono text-ink focus:outline-none focus:border-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-paper rounded-xl border border-paper-dim text-ink font-semibold"
                  >
                    <option value="employee">Counter Employee</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Branch Assignment
                  </label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-paper rounded-xl border border-paper-dim text-ink"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-paper text-ink rounded-xl text-xs font-medium hover:bg-paper-dim"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-ink text-white rounded-xl text-xs font-medium hover:bg-ink/90 shadow-md"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
