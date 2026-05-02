"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Shield, Activity, Fingerprint, Brain, TrendingUp, AlertTriangle } from "lucide-react";
import { API_URL } from "@/lib/utils";

interface StabilityComponent {
  score: number;
  weight: string;
  totalRuns?: number;
  totalRepairs?: number;
  successes?: number;
  totalFingerprints?: number;
  avgReuse?: number;
  totalPreferences?: number;
  totalApplications?: number;
  lastWeekFailures?: number;
  prevWeekFailures?: number;
}

interface StabilityData {
  overview: {
    stabilityScore: number;
    testPassRate: number;
    repairSuccessRate: number;
    fingerprintConfidence: number;
    orgMemoryStrength: number;
    failureTrend: string;
  };
  components: {
    testReliability: StabilityComponent;
    repairEfficiency: StabilityComponent;
    patternIntelligence: StabilityComponent;
    orgMemory: StabilityComponent;
    failureTrend: StabilityComponent;
  };
}

export default function OrgStabilityPage() {
  const [data, setData] = useState<StabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/intelligence/org-stability`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject("API error")))
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

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
        <p className="text-[var(--text-secondary)]">Unable to load stability data</p>
      </div>
    );
  }

  const score = data.overview.stabilityScore;
  const scoreColor = score >= 70 ? "text-green-600" : score >= 40 ? "text-amber-600" : "text-red-600";
  const scoreRing = score >= 70 ? "border-green-500" : score >= 40 ? "border-amber-500" : "border-red-500";
  const scoreLabel = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs Attention";

  const components = [
    {
      key: "testReliability",
      label: "Test Reliability",
      icon: Activity,
      data: data.components.testReliability,
      detail: `${data.components.testReliability.totalRuns?.toLocaleString()} test runs`,
    },
    {
      key: "repairEfficiency",
      label: "Repair Efficiency",
      icon: Shield,
      data: data.components.repairEfficiency,
      detail: `${data.components.repairEfficiency.successes}/${data.components.repairEfficiency.totalRepairs} repairs succeeded`,
    },
    {
      key: "patternIntelligence",
      label: "Pattern Intelligence",
      icon: Fingerprint,
      data: data.components.patternIntelligence,
      detail: `${data.components.patternIntelligence.totalFingerprints} fingerprints, ${data.components.patternIntelligence.avgReuse}x avg reuse`,
    },
    {
      key: "orgMemory",
      label: "Org Memory",
      icon: Brain,
      data: data.components.orgMemory,
      detail: `${data.components.orgMemory.totalPreferences} preferences, ${data.components.orgMemory.totalApplications} applications`,
    },
    {
      key: "failureTrend",
      label: "Failure Trend",
      icon: TrendingUp,
      data: data.components.failureTrend,
      detail: `${data.components.failureTrend.lastWeekFailures} this week vs ${data.components.failureTrend.prevWeekFailures} last week`,
    },
  ];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Shield className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-semibold">Org Stability Score</h1>
        </div>
        <p className="text-[13px] text-[var(--text-secondary)]">
          Composite score from test reliability, repair efficiency, pattern intelligence, org memory, and failure trends
        </p>
      </motion.div>

      {/* Main Score */}
      <div className="bg-white rounded-xl border border-[var(--border-default)] p-8 mb-8 text-center">
        <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-4 ${scoreRing} mb-4`}>
          <div>
            <div className={`text-4xl font-bold ${scoreColor}`}>{score}</div>
            <div className="text-xs text-[var(--text-tertiary)]">/ 100</div>
          </div>
        </div>
        <div className={`text-lg font-semibold ${scoreColor}`}>{scoreLabel}</div>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">
          {data.overview.failureTrend === "improving"
            ? "Failures are trending down — your CI is getting more stable."
            : "Failures increased this week — review recent changes."}
        </p>
      </div>

      {/* Component Breakdown */}
      <h2 className="font-semibold text-[15px] mb-4">Score Components</h2>
      <div className="space-y-4">
        {components.map((c) => {
          const Icon = c.icon;
          const compScore = c.data.score;
          const compColor = compScore >= 70 ? "bg-green-500" : compScore >= 40 ? "bg-amber-500" : "bg-red-500";

          return (
            <div key={c.key} className="bg-white rounded-lg border border-[var(--border-default)] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span className="font-medium text-sm">{c.label}</span>
                  <span className="text-xs text-[var(--text-tertiary)]">({c.data.weight})</span>
                </div>
                <span className={`text-lg font-bold ${compScore >= 70 ? "text-green-600" : compScore >= 40 ? "text-amber-600" : "text-red-600"}`}>
                  {compScore}
                </span>
              </div>
              <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden mb-2">
                <div className={`h-full ${compColor} rounded-full transition-all`} style={{ width: `${compScore}%` }} />
              </div>
              <p className="text-xs text-[var(--text-tertiary)]">{c.detail}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {[
          { label: "Test Pass Rate", value: `${data.overview.testPassRate}%` },
          { label: "Repair Success", value: `${data.overview.repairSuccessRate}%` },
          { label: "FP Confidence", value: `${data.overview.fingerprintConfidence}%` },
          { label: "Org Memory", value: `${data.overview.orgMemoryStrength}%` },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--bg-secondary)] rounded-lg p-4 text-center">
            <div className="text-[13px] text-[var(--text-secondary)]">{s.label}</div>
            <div className="text-xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <p className="text-xs text-[var(--text-tertiary)] mt-6 text-center">
        Stability score is computed from real CI data. It updates automatically as your team uses WarpFix.
      </p>
    </div>
  );
}
