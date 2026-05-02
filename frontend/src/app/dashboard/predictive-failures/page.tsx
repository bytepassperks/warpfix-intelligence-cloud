"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, ShieldAlert, Target, BarChart3, AlertTriangle } from "lucide-react";
import { API_URL } from "@/lib/utils";
import { UpgradeGate } from "@/components/ui/upgrade-gate";

interface Prediction {
  id: string;
  pattern_type: string;
  description: string;
  probability: number;
  category: string;
  based_on_prs: number;
  based_on_repos: number;
  times_prevented: number;
  suggestion: string;
  last_triggered_at: string;
}

interface RecentFailure {
  error_message: string;
  failure_type: string;
  branch: string;
  created_at: string;
  repo_name: string;
  fingerprint_hash: string;
  times_matched: number;
}

interface RiskCategory {
  category: string;
  patterns: number;
  prevented: number;
  avg_probability: number;
}

interface PredictiveData {
  overview: {
    activePredictions: number;
    totalPrevented: number;
    predictionAccuracy: number;
    riskCategories: number;
  };
  predictions: Prediction[];
  recentFailures: RecentFailure[];
  riskDistribution: RiskCategory[];
}

const TABS = ["Active Predictions", "Risk Distribution", "Recent Failures"] as const;

export default function PredictiveFailuresPage() {
  const [data, setData] = useState<PredictiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);
  const [gated, setGated] = useState<{feature: string; currentPlan: string; requiredPlan: string} | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/intelligence/predictive-failures`, { credentials: "include" })
      .then(async (r) => { if (r.status === 403) { const b = await r.json(); if (b.feature) { setGated({ feature: b.feature, currentPlan: b.current_plan || "free", requiredPlan: b.required_plan || "pro" }); return null; } } return r.ok ? r.json() : Promise.reject("API error"); })
      .then(setData)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--brand-primary)]" />
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

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
        <p className="text-[var(--text-secondary)]">Unable to load predictive failure data</p>
      </div>
    );
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <ShieldAlert className="w-6 h-6 text-red-500" />
          <h1 className="text-xl font-semibold">Predictive CI Failure</h1>
        </div>
        <p className="text-[13px] text-[var(--text-secondary)]">
          Analyze PR diffs against historical data to predict CI failures before they happen
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Predictions", value: data.overview.activePredictions, icon: Target, color: "text-indigo-500" },
          { label: "Failures Prevented", value: data.overview.totalPrevented.toLocaleString(), icon: ShieldAlert, color: "text-green-500" },
          { label: "Prediction Accuracy", value: `${data.overview.predictionAccuracy}%`, icon: BarChart3, color: "text-blue-500" },
          { label: "Risk Categories", value: data.overview.riskCategories, icon: AlertTriangle, color: "text-amber-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-[var(--border-default)] p-5">
            <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
            <div className="text-[13px] text-[var(--text-secondary)]">{s.label}</div>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[var(--bg-tertiary)] rounded-lg w-fit max-w-full overflow-x-auto mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-all whitespace-nowrap ${
              activeTab === tab
                ? "bg-white shadow-sm text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Active Predictions" && (
        <div className="space-y-3">
          {data.predictions.map((p) => (
            <div key={p.id} className="bg-white rounded-lg border border-[var(--border-default)] p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    p.probability >= 90 ? "bg-red-50 text-red-700" :
                    p.probability >= 75 ? "bg-amber-50 text-amber-700" :
                    "bg-blue-50 text-blue-700"
                  }`}>
                    {p.probability}% probability
                  </span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    {p.category}
                  </span>
                </div>
                <span className="text-sm font-semibold text-green-600">{p.times_prevented} prevented</span>
              </div>
              <p className="font-medium text-sm mb-1">{p.description}</p>
              <p className="text-xs text-[var(--text-tertiary)]">
                Based on <strong>{p.based_on_prs.toLocaleString()} PRs</strong> across <strong>{p.based_on_repos} repos</strong>
              </p>
              {p.suggestion && (
                <div className="mt-2 text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded px-3 py-2">
                  → {p.suggestion}
                </div>
              )}
            </div>
          ))}
          {data.predictions.length === 0 && (
            <p className="text-[var(--text-tertiary)] text-center py-8">No active predictions yet. Data grows as more repos are analyzed.</p>
          )}
        </div>
      )}

      {activeTab === "Risk Distribution" && (
        <div className="bg-white rounded-lg border border-[var(--border-default)] p-6">
          <h3 className="font-semibold text-[15px] mb-4">Risk by Category</h3>
          {data.riskDistribution.map((r) => {
            const max = Math.max(...data.riskDistribution.map((d) => parseInt(String(d.prevented)) || 1));
            return (
              <div key={r.category} className="mb-4">
                <div className="flex justify-between text-[13px] mb-1">
                  <span className="font-medium capitalize">{r.category.replace(/_/g, " ")}</span>
                  <span className="text-[var(--text-tertiary)]">{r.prevented} prevented ({r.avg_probability}% avg)</span>
                </div>
                <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${(parseInt(String(r.prevented)) / max) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "Recent Failures" && (
        <div className="space-y-3">
          {data.recentFailures.map((f, i) => (
            <div key={i} className="bg-white rounded-lg border border-[var(--border-default)] p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">{f.failure_type || "unknown"}</span>
                {f.repo_name && <span className="text-xs text-[var(--text-tertiary)]">{f.repo_name}</span>}
              </div>
              <p className="text-sm font-mono text-[var(--text-secondary)] truncate">{f.error_message}</p>
              {f.fingerprint_hash && (
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  Fingerprint: {f.fingerprint_hash} (matched {f.times_matched}x)
                </p>
              )}
            </div>
          ))}
          {data.recentFailures.length === 0 && (
            <p className="text-[var(--text-tertiary)] text-center py-8">No recent failures recorded yet.</p>
          )}
        </div>
      )}

      <p className="text-xs text-[var(--text-tertiary)] mt-6 text-center">
        Predictions improve as more repos are analyzed. All data is computed from real CI outcomes.
      </p>
    </div>
  );
}
