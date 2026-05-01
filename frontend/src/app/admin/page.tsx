"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "./layout";
import { Users, FolderGit2, Wrench, MessageSquareText, Tag, TrendingUp } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.warpfix.org";

interface Stats {
  users: { total: number; new_30d: number };
  repositories: { total: number };
  repairs: { total: number; completed: number; last_30d: number };
  reviews: { total: number };
  promos: { total: number; active: number };
  tier_breakdown: { plan: string; count: string }[];
  recent_signups: { id: string; username: string; email: string; plan: string; created_at: string }[];
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: number | string; sub?: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--border-default)] p-5 flex items-start justify-between">
      <div>
        <p className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-1">{label}</p>
        <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
        {sub && <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { token } = useAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-[var(--border-default)] p-5 h-[100px] animate-pulse">
              <div className="h-3 bg-gray-100 rounded w-20 mb-3" />
              <div className="h-6 bg-gray-100 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return <p className="text-[var(--text-tertiary)]">Failed to load stats.</p>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total Users" value={stats.users.total} sub={`${stats.users.new_30d} new this month`} icon={Users} color="bg-blue-50 text-blue-600" />
        <StatCard label="Repositories" value={stats.repositories.total} icon={FolderGit2} color="bg-purple-50 text-purple-600" />
        <StatCard label="Total Repairs" value={stats.repairs.total} sub={`${stats.repairs.completed} completed`} icon={Wrench} color="bg-green-50 text-green-600" />
        <StatCard label="Reviews" value={stats.reviews.total} icon={MessageSquareText} color="bg-amber-50 text-amber-600" />
        <StatCard label="Promos" value={stats.promos.total} sub={`${stats.promos.active} active`} icon={Tag} color="bg-pink-50 text-pink-600" />
        <StatCard label="Repairs (30d)" value={stats.repairs.last_30d} icon={TrendingUp} color="bg-indigo-50 text-indigo-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Breakdown */}
        <div className="bg-white rounded-xl border border-[var(--border-default)] p-5">
          <h3 className="text-[14px] font-semibold mb-4">Tier Breakdown</h3>
          <div className="space-y-3">
            {stats.tier_breakdown.map((t) => {
              const pct = stats.users.total > 0 ? (parseInt(t.count) / stats.users.total) * 100 : 0;
              const colors: Record<string, string> = { free: "bg-gray-400", pro: "bg-[var(--brand)]", team: "bg-purple-600" };
              return (
                <div key={t.plan}>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className="capitalize font-medium">{t.plan}</span>
                    <span className="text-[var(--text-tertiary)]">{t.count} users ({pct.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors[t.plan] || "bg-gray-400"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Signups */}
        <div className="bg-white rounded-xl border border-[var(--border-default)] p-5">
          <h3 className="text-[14px] font-semibold mb-4">Recent Signups</h3>
          <div className="space-y-2">
            {stats.recent_signups.map((u) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-[var(--border-default)] last:border-0">
                <div>
                  <p className="text-[13px] font-medium">{u.username}</p>
                  <p className="text-[11px] text-[var(--text-tertiary)]">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    u.plan === "team" ? "bg-purple-50 text-purple-600" :
                    u.plan === "pro" ? "bg-[var(--brand)]/8 text-[var(--brand)]" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {u.plan}
                  </span>
                  <span className="text-[11px] text-[var(--text-tertiary)]">
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {stats.recent_signups.length === 0 && (
              <p className="text-[13px] text-[var(--text-tertiary)] py-4 text-center">No users yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
