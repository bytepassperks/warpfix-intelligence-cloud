"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, FlaskConical, FileCheck, TrendingUp, AlertTriangle, Activity } from "lucide-react";
import { API_URL } from "@/lib/utils";
import { UpgradeGate } from "@/components/ui/upgrade-gate";

interface FileCoverage {
  test_file: string;
  tests_count: number;
  total_runs: number;
  passes: number;
  failures: number;
  pass_rate: number;
  last_run: string;
}

interface UntestedArea {
  context: string;
  failure_type: string;
  repo_name: string;
  created_at: string;
}

interface CoverageTrendItem {
  date: string;
  unique_tests: number;
  total_runs: number;
  pass_rate: number;
}

interface CoverageData {
  overview: {
    totalTests: number;
    totalFiles: number;
    totalRuns: number;
    overallPassRate: number;
    reposCovered: number;
    coverageScore: number;
  };
  fileCoverage: FileCoverage[];
  untestedAreas: UntestedArea[];
  coverageTrend: CoverageTrendItem[];
}

const TABS = ["File Coverage", "Coverage Trend", "Untested Areas"] as const;

export default function TestCoveragePage() {
  const [data, setData] = useState<CoverageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);
  const [gated, setGated] = useState<{feature: string; currentPlan: string; requiredPlan: string} | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/intelligence/test-coverage`, { credentials: "include" })
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
        <p className="text-[var(--text-secondary)]">Unable to load test coverage data</p>
      </div>
    );
  }

  const scoreColor = data.overview.coverageScore >= 70 ? "text-green-600" :
                     data.overview.coverageScore >= 40 ? "text-amber-600" : "text-red-600";

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <FlaskConical className="w-6 h-6 text-purple-500" />
          <h1 className="text-xl font-semibold">Test Coverage Analysis</h1>
        </div>
        <p className="text-[13px] text-[var(--text-secondary)]">
          Real test coverage metrics computed from CI test run history
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-[var(--border-default)] p-5">
          <div className="text-[13px] text-[var(--text-secondary)]">Coverage Score</div>
          <div className={`text-3xl font-bold mt-1 ${scoreColor}`}>{data.overview.coverageScore}</div>
          <div className="text-[11px] text-[var(--text-tertiary)]">out of 100</div>
        </div>
        {[
          { label: "Total Tests", value: data.overview.totalTests, icon: FlaskConical },
          { label: "Test Files", value: data.overview.totalFiles, icon: FileCheck },
          { label: "Pass Rate", value: `${data.overview.overallPassRate}%`, icon: Activity },
          { label: "Total Runs", value: data.overview.totalRuns.toLocaleString(), icon: TrendingUp },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-[var(--border-default)] p-5">
            <s.icon className="w-4 h-4 text-[var(--text-tertiary)] mb-2" />
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

      {activeTab === "File Coverage" && (
        <div className="bg-white rounded-lg border border-[var(--border-default)] overflow-x-auto">
          <table className="w-full text-[13px] min-w-[600px]">
            <thead className="bg-[var(--bg-secondary)]">
              <tr>
                <th className="text-left p-3 font-medium">Test File</th>
                <th className="text-right p-3 font-medium">Tests</th>
                <th className="text-right p-3 font-medium">Runs</th>
                <th className="text-right p-3 font-medium">Passes</th>
                <th className="text-right p-3 font-medium">Failures</th>
                <th className="text-right p-3 font-medium">Pass Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.fileCoverage.map((f) => (
                <tr key={f.test_file} className="border-t border-[var(--border-default)]">
                  <td className="p-3 font-mono text-sm">{f.test_file}</td>
                  <td className="p-3 text-right">{f.tests_count}</td>
                  <td className="p-3 text-right">{f.total_runs}</td>
                  <td className="p-3 text-right text-green-600">{f.passes}</td>
                  <td className="p-3 text-right text-red-600">{f.failures}</td>
                  <td className="p-3 text-right">
                    <span className={`font-semibold ${parseFloat(String(f.pass_rate)) >= 90 ? "text-green-600" : parseFloat(String(f.pass_rate)) >= 70 ? "text-amber-600" : "text-red-600"}`}>
                      {f.pass_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.fileCoverage.length === 0 && (
            <p className="text-[var(--text-tertiary)] text-center py-8">No test file data yet. Coverage grows as CI processes test runs.</p>
          )}
        </div>
      )}

      {activeTab === "Coverage Trend" && (
        <div className="bg-white rounded-lg border border-[var(--border-default)] p-6">
          <h3 className="font-semibold text-[15px] mb-4">Daily Test Activity (Last 30 Days)</h3>
          {data.coverageTrend.length > 0 ? (
            <div className="space-y-2">
              {data.coverageTrend.map((day) => {
                const maxRuns = Math.max(...data.coverageTrend.map((d) => d.total_runs || 1));
                return (
                  <div key={day.date} className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-tertiary)] w-20 shrink-0">{day.date}</span>
                    <div className="flex-1 h-4 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${(day.total_runs / maxRuns) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--text-secondary)] w-24 text-right">
                      {day.total_runs} runs ({day.pass_rate}%)
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[var(--text-tertiary)] text-center py-8">No trend data yet.</p>
          )}
        </div>
      )}

      {activeTab === "Untested Areas" && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-800">
              These are areas where CI failures occurred but no test runs were recorded, indicating potential gaps in test coverage.
            </p>
          </div>
          {data.untestedAreas.map((a, i) => (
            <div key={i} className="bg-white rounded-lg border border-[var(--border-default)] p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">{a.failure_type || "unknown"}</span>
                {a.repo_name && <span className="text-xs text-[var(--text-tertiary)]">{a.repo_name}</span>}
              </div>
              <p className="text-sm font-mono text-[var(--text-secondary)] truncate">{a.context}</p>
            </div>
          ))}
          {data.untestedAreas.length === 0 && (
            <p className="text-[var(--text-tertiary)] text-center py-8">All failure areas have corresponding test coverage.</p>
          )}
        </div>
      )}

      <p className="text-xs text-[var(--text-tertiary)] mt-6 text-center">
        Coverage data is computed from real CI test runs. Analysis improves as more tests are processed.
      </p>
    </div>
  );
}
