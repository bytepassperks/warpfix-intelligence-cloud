"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Bug, FileWarning, AlertTriangle, TrendingDown } from "lucide-react";
import { API_URL } from "@/lib/utils";

interface RecurringIssue {
  error_pattern: string;
  hash: string;
  times_matched: number;
  resolution_confidence: number;
  category: string;
  framework: string;
  last_matched_at: string;
}

interface HotspotFile {
  file_path: string;
  failure_count: number;
  total_runs: number;
  fail_rate: number;
}

interface StaleIssue {
  hash: string;
  error_pattern: string;
  times_matched: number;
  resolution_confidence: number;
  age_days: number;
}

interface DebtCategory {
  category: string;
  issues: number;
  total_occurrences: number;
  avg_confidence: number;
}

interface TechDebtData {
  overview: {
    debtScore: number;
    recurringIssues: number;
    hotspotFiles: number;
    staleIssues: number;
    avgResolutionConfidence: number;
  };
  recurringIssues: RecurringIssue[];
  hotspotFiles: HotspotFile[];
  staleIssues: StaleIssue[];
  debtCategories: DebtCategory[];
}

const TABS = ["Recurring Issues", "Hotspot Files", "Stale Patterns", "Categories"] as const;

export default function TechDebtPage() {
  const [data, setData] = useState<TechDebtData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(TABS[0]);

  useEffect(() => {
    fetch(`${API_URL}/api/intelligence/tech-debt`)
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
        <p className="text-[var(--text-secondary)]">Unable to load tech debt data</p>
      </div>
    );
  }

  const scoreColor = data.overview.debtScore <= 30 ? "text-green-600" :
                     data.overview.debtScore <= 60 ? "text-amber-600" : "text-red-600";

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <Bug className="w-6 h-6 text-orange-500" />
          <h1 className="text-xl font-semibold">Tech Debt Tracking</h1>
        </div>
        <p className="text-[13px] text-[var(--text-secondary)]">
          Track recurring CI failures, hotspot files, and stale patterns that indicate technical debt
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-[var(--border-default)] p-5 md:col-span-1">
          <div className="text-[13px] text-[var(--text-secondary)]">Debt Score</div>
          <div className={`text-3xl font-bold mt-1 ${scoreColor}`}>{data.overview.debtScore}</div>
          <div className="text-[11px] text-[var(--text-tertiary)]">lower is better</div>
        </div>
        {[
          { label: "Recurring Issues", value: data.overview.recurringIssues, icon: Bug },
          { label: "Hotspot Files", value: data.overview.hotspotFiles, icon: FileWarning },
          { label: "Stale Patterns", value: data.overview.staleIssues, icon: TrendingDown },
          { label: "Avg Confidence", value: `${data.overview.avgResolutionConfidence}%`, icon: AlertTriangle },
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

      {activeTab === "Recurring Issues" && (
        <div className="space-y-3">
          {data.recurringIssues.map((issue) => (
            <div key={issue.hash} className="bg-white rounded-lg border border-[var(--border-default)] p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 capitalize">
                    {(issue.category || "unknown").replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">{issue.framework}</span>
                </div>
                <span className="text-sm font-semibold">{issue.times_matched}x matched</span>
              </div>
              <p className="text-sm font-mono text-[var(--text-secondary)] truncate">{issue.error_pattern}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-tertiary)]">
                <span>Confidence: {issue.resolution_confidence}%</span>
                <span>Hash: {issue.hash}</span>
              </div>
            </div>
          ))}
          {data.recurringIssues.length === 0 && (
            <p className="text-[var(--text-tertiary)] text-center py-8">No recurring issues detected yet.</p>
          )}
        </div>
      )}

      {activeTab === "Hotspot Files" && (
        <div className="bg-white rounded-lg border border-[var(--border-default)] overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-[var(--bg-secondary)]">
              <tr>
                <th className="text-left p-3 font-medium">File</th>
                <th className="text-right p-3 font-medium">Failures</th>
                <th className="text-right p-3 font-medium">Total Runs</th>
                <th className="text-right p-3 font-medium">Fail Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.hotspotFiles.map((f) => (
                <tr key={f.file_path} className="border-t border-[var(--border-default)]">
                  <td className="p-3 font-mono text-sm">{f.file_path}</td>
                  <td className="p-3 text-right text-red-600 font-semibold">{f.failure_count}</td>
                  <td className="p-3 text-right">{f.total_runs}</td>
                  <td className="p-3 text-right">
                    <span className={`font-semibold ${parseFloat(String(f.fail_rate)) > 20 ? "text-red-600" : "text-amber-600"}`}>
                      {f.fail_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.hotspotFiles.length === 0 && (
            <p className="text-[var(--text-tertiary)] text-center py-8">No hotspot files detected yet.</p>
          )}
        </div>
      )}

      {activeTab === "Stale Patterns" && (
        <div className="space-y-3">
          {data.staleIssues.map((s) => (
            <div key={s.hash} className="bg-white rounded-lg border border-[var(--border-default)] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {Math.round(s.age_days)} days old
                </span>
                <span className="text-xs text-[var(--text-tertiary)]">Confidence: {s.resolution_confidence}%</span>
              </div>
              <p className="text-sm font-mono text-[var(--text-secondary)] truncate">{s.error_pattern}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Matched {s.times_matched} times</p>
            </div>
          ))}
          {data.staleIssues.length === 0 && (
            <p className="text-[var(--text-tertiary)] text-center py-8">No stale patterns found.</p>
          )}
        </div>
      )}

      {activeTab === "Categories" && (
        <div className="bg-white rounded-lg border border-[var(--border-default)] p-6">
          <h3 className="font-semibold text-[15px] mb-4">Debt by Category</h3>
          {data.debtCategories.map((c) => {
            const max = Math.max(...data.debtCategories.map((d) => parseInt(String(d.total_occurrences)) || 1));
            return (
              <div key={c.category} className="mb-4">
                <div className="flex justify-between text-[13px] mb-1">
                  <span className="font-medium capitalize">{c.category.replace(/_/g, " ")}</span>
                  <span className="text-[var(--text-tertiary)]">
                    {c.issues} issues, {c.total_occurrences} occurrences ({c.avg_confidence}% confidence)
                  </span>
                </div>
                <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: `${(parseInt(String(c.total_occurrences)) / max) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
          {data.debtCategories.length === 0 && (
            <p className="text-[var(--text-tertiary)] text-center py-4">No categories available yet.</p>
          )}
        </div>
      )}

      <p className="text-xs text-[var(--text-tertiary)] mt-6 text-center">
        Tech debt tracking is computed from real CI failure patterns. Data grows automatically as WarpFix processes more failures.
      </p>
    </div>
  );
}
