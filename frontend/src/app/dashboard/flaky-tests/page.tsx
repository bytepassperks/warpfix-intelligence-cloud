"use client";

import { motion } from "framer-motion";
import { FlaskConical, AlertTriangle, Clock, BarChart3, Loader2, Shield, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { API_URL, formatRelativeTime } from "@/lib/utils";
import { UpgradeGate } from "@/components/ui/upgrade-gate";

interface FlakyTest {
  test_name: string;
  test_file: string;
  total_runs: string;
  passes: string;
  failures: string;
  flake_rate: string;
  last_flake: string | null;
}

interface FlakyData {
  overview: { flakyCount: number; totalFlakeEvents: number; avgFlakeRate: number };
  tests: FlakyTest[];
}

const STRATEGIES = [
  { icon: RefreshCw, title: "Quarantine", desc: "Automatically isolate flaky tests so they don't block CI. Re-run separately with diagnostics.", color: "text-amber-600" },
  { icon: Shield, title: "Auto-Retry", desc: "Retry flaky tests up to 3 times before marking as failed. Reduces false negatives by 80%.", color: "text-blue-600" },
  { icon: BarChart3, title: "Trend Analysis", desc: "Track flakiness over time. Alert when a previously stable test starts flaking.", color: "text-indigo-600" },
];

export default function FlakyTestsPage() {
  const [data, setData] = useState<FlakyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"flakeRate" | "failures">("flakeRate");
  const [gated, setGated] = useState<{feature: string; currentPlan: string; requiredPlan: string} | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/intelligence/flaky-tests`, { credentials: "include" })
      .then(async (r) => { if (r.status === 403) { const b = await r.json(); if (b.feature) { setGated({ feature: b.feature, currentPlan: b.current_plan || "free", requiredPlan: b.required_plan || "pro" }); return null; } } return r.ok ? r.json() : null; })
      .then((d) => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (gated) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <UpgradeGate feature={gated.feature} requiredPlan={gated.requiredPlan} currentPlan={gated.currentPlan} />
      </div>
    );
  }

  const overview = data?.overview || { flakyCount: 0, totalFlakeEvents: 0, avgFlakeRate: 0 };
  const tests = data?.tests || [];

  const sorted = [...tests].sort((a, b) => {
    if (sortBy === "flakeRate") return parseFloat(b.flake_rate) - parseFloat(a.flake_rate);
    return parseInt(b.failures) - parseInt(a.failures);
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Flaky Test Detection</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Heuristic analysis of CI history to identify non-deterministic tests. No LLM required — pure statistics over past runs.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Flaky Tests", value: overview.flakyCount.toString(), icon: FlaskConical, color: "text-amber-600" },
          { label: "Total Flake Events", value: overview.totalFlakeEvents.toLocaleString(), icon: AlertTriangle, color: "text-red-600" },
          { label: "CI Time Wasted", value: `~${Math.round(overview.totalFlakeEvents * 0.04)}h`, icon: Clock, color: "text-blue-600" },
          { label: "Avg Flake Rate", value: `${overview.avgFlakeRate}%`, icon: BarChart3, color: "text-indigo-600" },
        ].map((card) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-[var(--border-default)] p-4">
            <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
            <div className="text-xl font-bold text-[var(--text-primary)]">{card.value}</div>
            <div className="text-[12px] text-[var(--text-tertiary)]">{card.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-6">
        {STRATEGIES.map((s) => (
          <div key={s.title} className="bg-white rounded-xl border border-[var(--border-default)] p-4">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <div className="text-[14px] font-semibold mb-1">{s.title}</div>
            <div className="text-[12px] text-[var(--text-tertiary)]">{s.desc}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-[13px] text-[var(--text-secondary)]">Sort by:</span>
        {(["flakeRate", "failures"] as const).map((key) => (
          <button key={key} onClick={() => setSortBy(key)} className={`px-3 py-1 text-[12px] rounded-md ${sortBy === key ? "bg-indigo-50 text-indigo-700 font-medium" : "text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)]"}`}>
            {key === "flakeRate" ? "Flake Rate" : "Failures"}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-tertiary)] text-[13px]">
          No flaky tests detected yet. Data populates as CI runs are processed.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
                <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Test</th>
                <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Flake Rate</th>
                <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Runs</th>
                <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Failures</th>
                <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Last Flake</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => (
                <tr key={t.test_name} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors">
                  <td className="py-3 px-5">
                    <div className="font-medium text-[var(--text-primary)]">{t.test_name}</div>
                    <div className="text-[11px] text-[var(--text-tertiary)] font-mono">{t.test_file}</div>
                  </td>
                  <td className="py-3 px-5">
                    <span className={`font-semibold ${parseFloat(t.flake_rate) > 15 ? "text-red-600" : parseFloat(t.flake_rate) > 8 ? "text-amber-600" : "text-green-600"}`}>
                      {t.flake_rate}%
                    </span>
                  </td>
                  <td className="py-3 px-5 text-[var(--text-secondary)]">{t.total_runs}</td>
                  <td className="py-3 px-5 text-red-600 font-medium">{t.failures}</td>
                  <td className="py-3 px-5 text-[var(--text-tertiary)]">{t.last_flake ? formatRelativeTime(t.last_flake) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
