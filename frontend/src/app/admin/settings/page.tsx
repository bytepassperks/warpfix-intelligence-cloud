"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "../layout";
import { Plus, Shield, Trash2, X, Key } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.warpfix.org";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export default function AdminSettingsPage() {
  const { token, admin } = useAdmin();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [changePasswordId, setChangePasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function fetchAdmins() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/admins`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAdmins(data.admins || []);
    } catch {
      // May fail if not super_admin
    }
    setLoading(false);
  }

  useEffect(() => { fetchAdmins(); }, [token]);

  async function createAdmin(data: { email: string; password: string; name: string; role: string }) {
    setError("");
    const res = await fetch(`${API}/admin/admins`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) { setError(result.error); return; }
    setShowAdd(false);
    fetchAdmins();
  }

  async function changePassword() {
    if (!changePasswordId || newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setError("");
    const res = await fetch(`${API}/admin/admins/${changePasswordId}/password`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ new_password: newPassword }),
    });
    const result = await res.json();
    if (!res.ok) { setError(result.error); return; }
    setChangePasswordId(null);
    setNewPassword("");
    setSuccess("Password updated");
    setTimeout(() => setSuccess(""), 3000);
  }

  return (
    <div className="space-y-6">
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{success}</div>}

      {/* Admin accounts */}
      <div className="bg-white rounded-xl border border-[var(--border-default)]">
        <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold">Admin Accounts</h3>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">Manage who has access to this admin panel</p>
          </div>
          {admin?.role === "super_admin" && (
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-2 bg-[var(--brand)] text-white rounded-lg text-sm font-medium hover:opacity-90">
              <Plus className="w-4 h-4" /> Add Admin
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-default)]">
            {admins.map((a) => (
              <div key={a.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--brand)]/8 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-[var(--brand)]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium">{a.name || a.email}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">{a.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                    a.role === "super_admin" ? "bg-purple-50 text-purple-600" : "bg-gray-100 text-gray-600"
                  }`}>
                    {a.role.replace("_", " ")}
                  </span>
                  <span className="text-[11px] text-[var(--text-tertiary)]">
                    {a.last_login_at ? `Last login: ${new Date(a.last_login_at).toLocaleDateString()}` : "Never logged in"}
                  </span>
                  <button
                    onClick={() => { setChangePasswordId(a.id); setNewPassword(""); setError(""); }}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                    title="Change Password"
                  >
                    <Key className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change password modal */}
      {changePasswordId && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setChangePasswordId(null)}>
          <div className="bg-white rounded-xl border shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold">Change Password</h3>
              <button onClick={() => setChangePasswordId(null)} className="p-1 hover:bg-gray-100 rounded-md"><X className="w-4 h-4" /></button>
            </div>
            {error && <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-[12px]">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setChangePasswordId(null)} className="px-3 py-2 text-sm border border-[var(--border-default)] rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={changePassword} className="px-3 py-2 text-sm bg-[var(--brand)] text-white rounded-lg hover:opacity-90">Update</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add admin modal */}
      {showAdd && <AddAdminModal onClose={() => setShowAdd(false)} onSave={createAdmin} error={error} />}
    </div>
  );
}

function AddAdminModal({ onClose, onSave, error }: { onClose: () => void; onSave: (data: { email: string; password: string; name: string; role: string }) => void; error: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("admin");

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl border shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold">Add Admin</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md"><X className="w-4 h-4" /></button>
        </div>
        {error && <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-[12px]">{error}</div>}
        <div className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm" required />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm" required />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm bg-white">
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-3 py-2 text-sm border border-[var(--border-default)] rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={() => onSave({ email, password, name, role })} disabled={!email || !password} className="px-3 py-2 text-sm bg-[var(--brand)] text-white rounded-lg hover:opacity-90 disabled:opacity-50">Create</button>
          </div>
        </div>
      </div>
    </div>
  );
}
