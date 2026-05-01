"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdmin } from "../layout";
import { Search, Plus, ChevronDown, RotateCcw, Trash2, Edit2, X } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.warpfix.org";

interface User {
  id: string;
  github_id: number;
  username: string;
  email: string;
  avatar_url: string;
  plan: string;
  repairs_used_this_month: number;
  created_at: string;
  updated_at: string;
}

export default function UsersPage() {
  const { token, admin } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [tierChangeUser, setTierChangeUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (search) params.set("search", search);
    if (planFilter) params.set("plan", planFilter);

    const res = await fetch(`${API}/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setUsers(data.users || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [token, page, search, planFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function changeTier(userId: string, plan: string) {
    await fetch(`${API}/admin/users/${userId}/tier`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    setTierChangeUser(null);
    fetchUsers();
  }

  async function resetUsage(userId: string) {
    await fetch(`${API}/admin/users/${userId}/reset-usage`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchUsers();
  }

  async function deleteUser(userId: string) {
    if (!confirm("Are you sure? This will delete the user and all their data.")) return;
    await fetch(`${API}/admin/users/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchUsers();
  }

  async function updateUser(userId: string, updates: Record<string, string | number>) {
    await fetch(`${API}/admin/users/${userId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setEditUser(null);
    fetchUsers();
  }

  async function addUser(data: { username: string; email: string; plan: string }) {
    await fetch(`${API}/admin/users`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowAddModal(false);
    fetchUsers();
  }

  async function bulkChangeTier(plan: string) {
    if (selectedUsers.length === 0) return;
    await fetch(`${API}/admin/users/bulk-tier`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ user_ids: selectedUsers, plan }),
    });
    setSelectedUsers([]);
    fetchUsers();
  }

  const pages = Math.ceil(total / 50);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search users..."
            className="w-full pl-9 pr-3 py-2 border border-[var(--border-default)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/20"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm bg-white"
        >
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="team">Team</option>
        </select>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-[var(--brand)] text-white rounded-lg text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> Add User
        </button>
        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-2 ml-2">
            <span className="text-[12px] text-[var(--text-tertiary)]">{selectedUsers.length} selected</span>
            {["free", "pro", "team"].map((p) => (
              <button key={p} onClick={() => bulkChangeTier(p)} className="px-2 py-1 text-[11px] border border-[var(--border-default)] rounded hover:bg-gray-50 capitalize">
                Set {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
                <th className="px-4 py-3 text-left w-8">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={(e) => setSelectedUsers(e.target.checked ? users.map((u) => u.id) : [])}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-tertiary)]">User</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-tertiary)]">Email</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-tertiary)]">Plan</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-tertiary)]">Usage</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-tertiary)]">Joined</th>
                <th className="px-4 py-3 text-right font-medium text-[var(--text-tertiary)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border-default)]">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--text-tertiary)]">No users found</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-[var(--border-default)] hover:bg-[var(--bg-secondary)]/50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => setSelectedUsers(e.target.checked ? [...selectedUsers, user.id] : selectedUsers.filter((id) => id !== user.id))}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-medium">{user.username?.[0]?.toUpperCase()}</div>
                        )}
                        <span className="font-medium">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{user.email || "—"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setTierChangeUser(user)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium cursor-pointer ${
                          user.plan === "team" ? "bg-purple-50 text-purple-600" :
                          user.plan === "pro" ? "bg-[var(--brand)]/8 text-[var(--brand)]" :
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.plan} <ChevronDown className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[var(--text-secondary)]">{user.repairs_used_this_month}</span>
                      <span className="text-[var(--text-tertiary)]"> / {user.plan === "free" ? 3 : "∞"}</span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-tertiary)]">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setEditUser(user)} title="Edit" className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                          <Edit2 className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                        </button>
                        <button onClick={() => resetUsage(user.id)} title="Reset Usage" className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                          <RotateCcw className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                        </button>
                        {admin?.role === "super_admin" && (
                          <button onClick={() => deleteUser(user.id)} title="Delete" className="p-1.5 hover:bg-red-50 rounded-md transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-default)] text-[12px] text-[var(--text-tertiary)]">
            <span>Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total}</span>
            <div className="flex gap-1">
              {Array.from({ length: pages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-2.5 py-1 rounded ${page === i + 1 ? "bg-[var(--brand)] text-white" : "hover:bg-gray-100"}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tier change popover */}
      {tierChangeUser && (
        <Modal title={`Change tier for ${tierChangeUser.username}`} onClose={() => setTierChangeUser(null)}>
          <div className="space-y-2">
            {["free", "pro", "team"].map((p) => (
              <button
                key={p}
                onClick={() => changeTier(tierChangeUser.id, p)}
                className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                  tierChangeUser.plan === p ? "border-[var(--brand)] bg-[var(--brand)]/5 font-medium" : "border-[var(--border-default)] hover:bg-gray-50"
                }`}
              >
                <span className="capitalize font-medium">{p}</span>
                <span className="text-[var(--text-tertiary)] ml-2">
                  {p === "free" ? "3 repairs/mo, 1 repo" : p === "pro" ? "Unlimited repairs & repos" : "Everything + team features"}
                </span>
                {tierChangeUser.plan === p && <span className="ml-2 text-[var(--brand)]">(current)</span>}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Edit user modal */}
      {editUser && <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSave={updateUser} />}

      {/* Add user modal */}
      {showAddModal && <AddUserModal onClose={() => setShowAddModal(false)} onSave={addUser} />}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl border border-[var(--border-default)] shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose, onSave }: { user: User; onClose: () => void; onSave: (id: string, data: Record<string, string | number>) => void }) {
  const [email, setEmail] = useState(user.email || "");
  const [username, setUsername] = useState(user.username);

  return (
    <Modal title={`Edit ${user.username}`} onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-3 py-2 text-sm border border-[var(--border-default)] rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave(user.id, { username, email })} className="px-3 py-2 text-sm bg-[var(--brand)] text-white rounded-lg hover:opacity-90">Save</button>
        </div>
      </div>
    </Modal>
  );
}

function AddUserModal({ onClose, onSave }: { onClose: () => void; onSave: (data: { username: string; email: string; plan: string }) => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("free");

  return (
    <Modal title="Add User" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm" required />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm" required />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Plan</label>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm bg-white">
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="team">Team</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-3 py-2 text-sm border border-[var(--border-default)] rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave({ username, email, plan })} disabled={!username || !email} className="px-3 py-2 text-sm bg-[var(--brand)] text-white rounded-lg hover:opacity-90 disabled:opacity-50">Add User</button>
        </div>
      </div>
    </Modal>
  );
}
