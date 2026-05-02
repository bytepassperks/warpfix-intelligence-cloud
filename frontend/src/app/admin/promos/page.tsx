"use client";

import { useEffect, useState, useCallback } from "react";
import { useAdmin } from "../layout";
import { Plus, Trash2, X, ToggleLeft, ToggleRight, Layers, Users, ChevronDown, ChevronUp, Copy, Download, Pencil, Clock } from "lucide-react";

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
  duration_days: number | null;
  times_redeemed: string;
  created_at: string;
}

interface Redemption {
  id: string;
  redeemed_at: string;
  user_id: string;
  username: string;
  email: string;
  avatar_url: string;
  plan: string;
  applied_by_admin: string | null;
}

export default function PromosPage() {
  const { token } = useAdmin();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [expandedPromo, setExpandedPromo] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<Record<string, Redemption[]>>({});
  const [loadingRedemptions, setLoadingRedemptions] = useState<string | null>(null);
  const [editingDuration, setEditingDuration] = useState<string | null>(null);
  const [durationInput, setDurationInput] = useState("");

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

  async function bulkGenerate(data: Record<string, unknown>) {
    const res = await fetch(`${API}/admin/promos/bulk`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    fetchPromos();
    return result;
  }

  async function updateDuration(promoId: string) {
    const val = parseInt(durationInput);
    await fetch(`${API}/admin/promos/${promoId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ duration_days: val > 0 ? val : null }),
    });
    setEditingDuration(null);
    setDurationInput("");
    fetchPromos();
  }

  async function fetchRedemptions(promoId: string) {
    if (expandedPromo === promoId) {
      setExpandedPromo(null);
      return;
    }
    setLoadingRedemptions(promoId);
    setExpandedPromo(promoId);
    try {
      const res = await fetch(`${API}/admin/promos/${promoId}/redemptions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRedemptions((prev) => ({ ...prev, [promoId]: data.redemptions || [] }));
    } catch {
      setRedemptions((prev) => ({ ...prev, [promoId]: [] }));
    }
    setLoadingRedemptions(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[var(--text-tertiary)]">{promos.length} promo codes</p>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowBulk(true)} className="flex items-center gap-1.5 px-3 py-2 border border-[var(--border-default)] text-[var(--text-secondary)] rounded-lg text-sm font-medium hover:bg-gray-50">
            <Layers className="w-4 h-4" /> Bulk Generate
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-3 py-2 bg-[var(--brand)] text-white rounded-lg text-sm font-medium hover:opacity-90">
            <Plus className="w-4 h-4" /> Create Promo
          </button>
        </div>
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
              <th className="px-4 py-3 text-left font-medium text-[var(--text-tertiary)]">Duration</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-tertiary)]">Expires</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-tertiary)]">Status</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--text-tertiary)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border-default)]">
                  {Array.from({ length: 10 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse w-16" /></td>
                  ))}
                </tr>
              ))
            ) : promos.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-[var(--text-tertiary)]">No promo codes yet</td></tr>
            ) : (
              promos.map((promo) => (
                <>
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
                      <button
                        onClick={() => fetchRedemptions(promo.id)}
                        className="flex items-center gap-1 hover:text-[var(--brand)] transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{promo.times_redeemed}{promo.max_redemptions ? ` / ${promo.max_redemptions}` : ""}</span>
                        {expandedPromo === promo.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {editingDuration === promo.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={durationInput}
                            onChange={(e) => setDurationInput(e.target.value)}
                            className="w-16 px-1.5 py-0.5 border border-[var(--border-default)] rounded text-[12px]"
                            placeholder="days"
                            min="0"
                            autoFocus
                            onKeyDown={(e) => { if (e.key === "Enter") updateDuration(promo.id); if (e.key === "Escape") setEditingDuration(null); }}
                          />
                          <button onClick={() => updateDuration(promo.id)} className="text-green-600 text-[11px] font-medium">Save</button>
                          <button onClick={() => setEditingDuration(null)} className="text-gray-400 text-[11px]">Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingDuration(promo.id); setDurationInput(promo.duration_days?.toString() || ""); }}
                          className="flex items-center gap-1 hover:text-[var(--brand)] transition-colors group"
                        >
                          {promo.duration_days ? (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[var(--text-tertiary)]" />
                              <span className="text-[var(--text-secondary)]">{promo.duration_days}d</span>
                            </span>
                          ) : (
                            <span className="text-[var(--text-tertiary)]">—</span>
                          )}
                          <Pencil className="w-3 h-3 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100" />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-tertiary)]">
                      {promo.expires_at ? new Date(promo.expires_at).toLocaleDateString() : "Never"}
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
                  {expandedPromo === promo.id && (
                    <tr key={`${promo.id}-details`} className="border-b border-[var(--border-default)] bg-gray-50/50">
                      <td colSpan={10} className="px-6 py-4">
                        <RedemptionDetails
                          promoId={promo.id}
                          redemptions={redemptions[promo.id] || []}
                          loading={loadingRedemptions === promo.id}
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <CreatePromoModal onClose={() => setShowAdd(false)} onSave={createPromo} />}
      {showBulk && <BulkGenerateModal onClose={() => setShowBulk(false)} onGenerate={bulkGenerate} />}
    </div>
  );
}

function RedemptionDetails({ promoId, redemptions, loading }: { promoId: string; redemptions: Redemption[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[12px] text-[var(--text-tertiary)]">
        <div className="w-4 h-4 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
        Loading redemption details...
      </div>
    );
  }

  if (redemptions.length === 0) {
    return <p className="text-[12px] text-[var(--text-tertiary)]">No redemptions yet for this promo code.</p>;
  }

  return (
    <div>
      <p className="text-[12px] font-medium text-[var(--text-secondary)] mb-2">{redemptions.length} redemption{redemptions.length !== 1 ? "s" : ""}</p>
      <div className="space-y-2">
        {redemptions.map((r) => (
          <div key={r.id} className="flex items-center gap-3 bg-white rounded-lg border border-[var(--border-default)] px-3 py-2">
            {r.avatar_url ? (
              <img src={r.avatar_url} alt="" className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-medium">
                {r.username?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium">{r.username || "Unknown"}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  r.plan === "team" ? "bg-purple-50 text-purple-600" :
                  r.plan === "pro" ? "bg-blue-50 text-blue-600" :
                  "bg-gray-100 text-gray-600"
                }`}>{r.plan}</span>
              </div>
              <p className="text-[11px] text-[var(--text-tertiary)]">{r.email || "No email"}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-[var(--text-tertiary)]">{new Date(r.redeemed_at).toLocaleDateString()} {new Date(r.redeemed_at).toLocaleTimeString()}</p>
              {r.applied_by_admin && <p className="text-[10px] text-[var(--text-tertiary)]">by {r.applied_by_admin}</p>}
            </div>
          </div>
        ))}
      </div>
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
  const [durationDays, setDurationDays] = useState("");

  function handleSave() {
    onSave({
      code,
      description,
      discount_type: discountType,
      discount_value: parseFloat(discountValue) || 0,
      plan_override: planOverride || null,
      max_redemptions: maxRedemptions ? parseInt(maxRedemptions) : null,
      expires_at: expiresAt || null,
      duration_days: durationDays ? parseInt(durationDays) : null,
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
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Duration (days)</label>
            <input type="number" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} placeholder="e.g. 30 for 1 month" min="1" className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm" />
            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Plan auto-downgrades after this many days. Leave empty for permanent.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Max Redemptions</label>
              <input type="number" value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} placeholder="Unlimited" className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Expires At</label>
              <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm" />
              <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">When the promo code itself can no longer be redeemed.</p>
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

function BulkGenerateModal({ onClose, onGenerate }: { onClose: () => void; onGenerate: (data: Record<string, unknown>) => Promise<{ created: number; failed: number; promos: Promo[] }> }) {
  const [prefix, setPrefix] = useState("");
  const [count, setCount] = useState("10");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("0");
  const [planOverride, setPlanOverride] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: number; promos: Promo[] } | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await onGenerate({
        prefix,
        count: parseInt(count) || 10,
        description,
        discount_type: discountType,
        discount_value: parseFloat(discountValue) || 0,
        plan_override: planOverride || null,
        max_redemptions: maxRedemptions ? parseInt(maxRedemptions) : null,
        expires_at: expiresAt || null,
        duration_days: durationDays ? parseInt(durationDays) : null,
      });
      setResult(res);
    } catch {
      // handled by parent
    }
    setGenerating(false);
  }

  function copyAllCodes() {
    if (!result?.promos) return;
    const codes = result.promos.map((p) => p.code).join("\n");
    navigator.clipboard.writeText(codes);
  }

  function downloadCSV() {
    if (!result?.promos) return;
    const header = "Code,Description,Discount Type,Discount Value,Plan Override,Max Redemptions,Expires At\n";
    const rows = result.promos.map((p) =>
      `${p.code},"${p.description}",${p.discount_type},${p.discount_value},${p.plan_override || ""},${p.max_redemptions || ""},${p.expires_at || ""}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `promo-codes-${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (result) {
    return (
      <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-xl border border-[var(--border-default)] shadow-xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold">Bulk Generation Complete</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                {result.created} codes created
              </div>
              {result.failed > 0 && (
                <div className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
                  {result.failed} failed
                </div>
              )}
            </div>
            <div className="max-h-[200px] overflow-y-auto border border-[var(--border-default)] rounded-lg p-3 bg-gray-50">
              <div className="grid grid-cols-2 gap-1">
                {result.promos.map((p) => (
                  <code key={p.id} className="text-[12px] font-mono text-[var(--brand)]">{p.code}</code>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={copyAllCodes} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[var(--border-default)] rounded-lg hover:bg-gray-50">
                <Copy className="w-3.5 h-3.5" /> Copy All Codes
              </button>
              <button onClick={downloadCSV} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[var(--border-default)] rounded-lg hover:bg-gray-50">
                <Download className="w-3.5 h-3.5" /> Download CSV
              </button>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={onClose} className="px-3 py-2 text-sm bg-[var(--brand)] text-white rounded-lg hover:opacity-90">Done</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl border border-[var(--border-default)] shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[15px] font-semibold">Bulk Generate Promo Codes</h3>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">Generate multiple unique promo codes at once</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-md"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Prefix</label>
              <input value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} placeholder="PROMO" className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm font-mono" required />
              <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Codes: PREFIX-XXXXXX</p>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Count</label>
              <input type="number" value={count} onChange={(e) => setCount(e.target.value)} min="1" max="500" className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm" />
              <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Max 500 per batch</p>
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Bulk promo for campaign" className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm" />
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
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Plan Override (tier)</label>
            <select value={planOverride} onChange={(e) => setPlanOverride(e.target.value)} className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm bg-white">
              <option value="">None</option>
              <option value="pro">Upgrade to Pro</option>
              <option value="team">Upgrade to Team</option>
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Duration (days)</label>
            <input type="number" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} placeholder="e.g. 30 for 1 month" min="1" className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm" />
            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">Plan auto-downgrades after this many days. Leave empty for permanent.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Max Redemptions (per code)</label>
              <input type="number" value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} placeholder="Unlimited" className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Validity (expires at)</label>
              <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full px-3 py-2 border border-[var(--border-default)] rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-3 py-2 text-sm border border-[var(--border-default)] rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleGenerate} disabled={!prefix || generating} className="px-3 py-2 text-sm bg-[var(--brand)] text-white rounded-lg hover:opacity-90 disabled:opacity-50">
              {generating ? "Generating..." : `Generate ${count || 0} Codes`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
