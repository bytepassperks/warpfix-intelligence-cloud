"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdmin } from "../layout";
import { Plus, Trash2, Edit2, X, ToggleLeft, ToggleRight } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.warpfix.org";

interface Promo {
  id: string;
  code: string;
  description: string;
  discount_type: string;
  discount_value: number;
  plan_override: string | null;
  max_redemptions: number | null;
  active: boolean;
  expires_at: string | null;
  times_redeemed: string;
  created_at: string;
}

export default function PromosPage() {
  const { token } = useAdmin();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API}/admin/promos`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setPromos(data.promos || []);
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchPromos(); }, [fetchPromos]);

  async function toggleActive(id: string, active: boolean) {
    await fetch(`${API}/admin/promos/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    fetchPromos();
  }

  async function deletePromo(id: string) {
    if (!confirm("Delete this promo code?")) return;
    await fetch(`${API}/admin/promos/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchPromos();
  }

  async function createPromo(data: Record<string, unknown>) {
    await fetch(`${API}/admin/promos`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setShowAdd(false);
    fetchPromos();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--text-tertiary)]">{promos.length} promo codes</p>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-2 bg-[var(--brand)] text-white rounded-lg text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> Create Promo
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
              <th className="px-4 py-3 text-left font-medium text-[var(--text-tertiary)]">Code</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-tertiary)]">Description</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-tertiary)]">Type</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-tertiary)]">Value</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-tertiary)]">Plan Override</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-tertiary)]">Redemptions</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-tertiary)]">Status</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--text-tertiary)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border-default)]">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-16" /></td>
                  ))}
                </tr>
              ))
            ) : promos.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-[var(--text-tertiary)]">No promo codes yet</td></tr>
            ) : (
              promos.map((promo) => (
                <tr key={promo.id} className="border-b border-[var(--border-default)] hover:bg-[var(--bg-secondary)]/50">
                  <td className="px-4 py-3 font-mono font-semibold text-[var(--brand)]">{promo.code}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] max-w-[200px] truncate">{promo.description || "—"}</td>
                  <td className="px-4 py-3 capitalize">{promo.discount_type}</td>
                  <td className="px-4 py-3">{promo.discount_type === "percentage" ? `${promo.discount_value}%` : `$${promo.discount_value}`}</td>
                  <td className="px-4 py-3">
                    {promo.plan_override ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-600 capitalize">{promo.plan_override}</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {promo.times_redeemed}{promo.max_redemptions ? ` / ${promo.max_redemptions}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(promo.id, promo.active)} className="flex items-center gap-1">
                      {promo.active ? (
                        <><ToggleRight className="w-5 h-5 text-green-500" /> <span className="text-green-600 text-[11px]">Active</span></>
                      ) : (
                        <><ToggleLeft className="w-5 h-5 text-gray-400" /> <span className="text-gray-500 text-[11px]">Inactive</span></>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => deletePromo(promo.id)} className="p-1.5 hover:bg-red-50 rounded-md transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <CreatePromoModal onClose={() => setShowAdd(false)} onSave={createPromo} />}
    </div>
  );
}

function CreatePromoModal({ onClose, onSave }: { onClose: () => void; onSave: (data: Record<string, unknown>) => void }) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("0");
  const [planOverride, setPlanOverride] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  function handleSave() {
    onSave({
      code,
      description,
      discount_type: discountType,
      discount_value: parseFloat(discountValue) || 0,
      plan_override: planOverride || null,
      max_redemptions: maxRedemptions ? parseInt(maxRedemptions) : null,
      expires_at: expiresAt || null,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl border border-[var(--border-default)] shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold">Create Promo Code</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Code</label>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="WARPFIX2024" className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm font-mono" required />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Launch promo" className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Discount Type</label>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm bg-white">
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Value</label>
              <input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Plan Override (optional)</label>
            <select value={planOverride} onChange={(e) => setPlanOverride(e.target.value)} className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm bg-white">
              <option value="">None</option>
              <option value="pro">Upgrade to Pro</option>
              <option value="team">Upgrade to Team</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Max Redemptions</label>
              <input type="number" value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} placeholder="Unlimited" className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Expires At</label>
              <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-3 py-2 text-sm border border-[var(--border-default)] rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSave} disabled={!code} className="px-3 py-2 text-sm bg-[var(--brand)] text-white rounded-lg hover:opacity-90 disabled:opacity-50">Create</button>
          </div>
        </div>
      </div>
    </div>
  );
}
