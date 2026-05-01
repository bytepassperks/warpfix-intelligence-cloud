"use client";

import { motion } from "framer-motion";
import { Brain, Fingerprint, Users, FileWarning, BarChart3, TrendingUp, Clock, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { API_URL } from "@/lib/utils";

interface CiBrainData {
  overview: {
    totalTestRuns: number;
    uniqueTests: number;
    uniqueFiles: number;
    totalFailures: number;
    totalPasses: number;
    totalFingerprints: number;
    totalMatches: number;
    teams: number;
  };
  flakyTests: {
    test_name: string;
    test_file: string;
    total_runs: string;
    passes: string;
    failures: string;
    pass_rate: string;
  }[];
  hotspotFiles: {
    test_file: string;
    failures: string;
    total_runs: string;
    fail_rate: string;
  }[];
  dailyTrend: {
    date: string;
    passes: string;
    failures: string;
  }[];
}

const TABS = ["Test Reliability", "Fingerprint History", "Owner Hotspots"] as const;

export default function CiBrainPage() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("Test Reliability");
  const [data, setData] = useState<CiBrainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_URL}/api/intelligence/ci-brain`, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          Failed to load CI Brain data: {error || "No data available"}
        </div>
      </div>
    );
  }

  const { overview, flakyTests, hotspotFiles } = data;

  const summaryCards = [
    { label: "Tests Tracked", value: overview.uniqueTests.toLocaleString(), icon: BarChart3, color: "text-indigo-600" },
    { label: "Fingerprints", value: overview.totalFingerprints.toLocaleString(), icon: Fingerprint, color: "text-purple-600" },
    { label: "Files Monitored", value: overview.uniqueFiles.toLocaleString(), icon: FileWarning, color: "text-amber-600" },
    { label: "Teams Mapped", value: overview.teams.toLocaleString(), icon: Users, color: "text-blue-600" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">CI Brain</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Deep CI observability — per-test reliability scores, fingerprint intelligence across repos, and owner/hotspot mapping. All computed from logs, no LLM required.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {summaryCards.map((card) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-[var(--border-default)] p-4">
            <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
            <div className="text-xl font-bold text-[var(--text-primary)]">{card.value}</div>
            <div className="text-[12px] text-[var(--text-tertiary)]">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Total runs banner */}
      <div className="mb-6 bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center justify-between">
        <span className="text-[13px] text-indigo-700">
          <strong>{overview.totalTestRuns.toLocaleString()}</strong> total test runs analyzed &middot;{" "}
          <strong>{overview.totalPasses.toLocaleString()}</strong> passed &middot;{" "}
          <strong>{overview.totalFailures.toLocaleString()}</strong> failed
        </span>
        <span className="text-[12px] text-indigo-500">
          {overview.totalTestRuns > 0
            ? `${((overview.totalPasses / overview.totalTestRuns) * 100).toFixed(1)}% overall pass rate`
            : "No runs yet"}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[var(--bg-secondary)] rounded-lg mb-6 w-fit">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md text-[13px] font-medium transition-colors ${
            activeTab === tab ? "bg-white text-[var(--text-primary)] shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          }`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Test Reliability" && (
        <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-default)]">
            <span className="text-[13px] font-semibold">Per-Test Reliability Scores</span>
            <span className="text-[11px] text-[var(--text-tertiary)] ml-2">(sorted by flakiness — lowest pass rate first)</span>
          </div>
          <div className="divide-y divide-[var(--border-default)]">
            {flakyTests.map((test) => {
              const passRate = parseFloat(test.pass_rate) || 0;
              const runs = parseInt(test.total_runs) || 0;
              const fails = parseInt(test.failures) || 0;
              return (
                <div key={test.test_name} className="px-5 py-4 hover:bg-[var(--bg-secondary)] transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-medium text-[var(--text-primary)]">{test.test_name}</span>
                    <span className={`text-[14px] font-bold ${
                      passRate >= 95 ? "text-green-600" : passRate >= 80 ? "text-amber-600" : "text-red-600"
                    }`}>
                      {passRate}%
                    </span>
                  </div>
                  <div className="text-[12px] text-[var(--text-tertiary)] font-mono mb-2">{test.test_file}</div>
                  <div className="flex items-center gap-4 text-[11px] text-[var(--text-tertiary)]">
                    <span>{runs} runs</span>
                    <span>{fails} failures</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${
                      passRate >= 95 ? "bg-green-400" : passRate >= 80 ? "bg-amber-400" : "bg-red-400"
                    }`} style={{ width: `${passRate}%` }} />
                  </div>
                </div>
              );
            })}
            {flakyTests.length === 0 && (
              <div className="px-5 py-8 text-center text-[13px] text-[var(--text-tertiary)]">
                No test data available yet. Test runs will appear here as WarpFix processes CI results.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "Fingerprint History" && (
        <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-default)]">
            <span className="text-[13px] font-semibold">Fingerprint Intelligence Across Repos</span>
            <span className="text-[11px] text-[var(--text-tertiary)] ml-2">({overview.totalFingerprints} patterns, {overview.totalMatches.toLocaleString()} total matches)</span>
          </div>
          <div className="px-5 py-8 text-center text-[13px] text-[var(--text-tertiary)]">
            <Fingerprint className="w-8 h-8 text-purple-300 mx-auto mb-3" />
            <p>Fingerprint details are available in the <strong>Failure Genome</strong> page with full pattern explorer.</p>
          </div>
        </div>
      )}

      {activeTab === "Owner Hotspots" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border-default)]">
              <span className="text-[13px] font-semibold">Top Failure-Prone Files (Last 90 Days)</span>
            </div>
            <div className="divide-y divide-[var(--border-default)]">
              {hotspotFiles.map((spot) => {
                const failRate = parseFloat(spot.fail_rate) || 0;
                return (
                  <div key={spot.test_file} className="px-5 py-4 hover:bg-[var(--bg-secondary)] transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[13px] font-mono text-[var(--text-primary)]">{spot.test_file}</span>
                      <span className="text-[12px] font-semibold text-red-600">{spot.failures} failures</span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-[var(--text-tertiary)]">
                      <span>{spot.total_runs} total runs</span>
                      <span>{failRate}% fail rate</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${Math.min(failRate * 3, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
              {hotspotFiles.length === 0 && (
                <div className="px-5 py-8 text-center text-[13px] text-[var(--text-tertiary)]">
                  No hotspot data yet. File-level failure data appears as more CI runs are processed.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-center">
        <p className="text-[13px] text-[var(--text-secondary)]">
          CI Brain analytics are unlimited on all plans — computed from logs, no LLM tokens needed.
        </p>
      </div>
    </div>
  );
}
