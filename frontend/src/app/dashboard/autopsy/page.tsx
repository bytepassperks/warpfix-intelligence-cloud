"use client";

import { motion } from "framer-motion";
import { FileSearch, GitBranch, History, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { API_URL, formatRelativeTime } from "@/lib/utils";
import { UpgradeGate } from "@/components/ui/upgrade-gate";

interface AutopsyReport {
  id: string;
  error_message: string;
  failure_type: string;
  branch: string;
  stack_trace: string | null;
  workflow_name: string;
  created_at: string;
  repo_name: string;
  fingerprint_hash: string | null;
  historical_matches: number | null;
  error_pattern: string | null;
  resolution_confidence: number | null;
  category: string | null;
  patch_summary: string | null;
  repair_status: string | null;
}

interface AutopsyData {
  overview: { totalReports: number; uniqueRootCauses: number; autoResolved: number };
  reports: AutopsyReport[];
}

export default function AutopsyPage() {
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [data, setData] = useState<AutopsyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [gated, setGated] = useState<{feature: string; currentPlan: string; requiredPlan: string} | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/intelligence/autopsy`, { credentials: "include" })
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

  const overview = data?.overview || { totalReports: 0, uniqueRootCauses: 0, autoResolved: 0 };
  const reports = data?.reports || [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Autopsy Reports</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Rich failure analysis for every CI failure — root cause hypothesis, affected files, historical fingerprints, and actionable next steps. Free on all plans.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Reports Generated", value: overview.totalReports.toLocaleString(), icon: FileSearch, color: "text-indigo-600" },
          { label: "Unique Root Causes", value: overview.uniqueRootCauses.toLocaleString(), icon: AlertTriangle, color: "text-amber-600" },
          { label: "Auto-Resolved", value: `${overview.autoResolved}%`, icon: CheckCircle2, color: "text-green-600" },
        ].map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-[var(--border-default)] p-4"
          >
            <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
            <div className="text-xl font-bold text-[var(--text-primary)]">{card.value}</div>
            <div className="text-[12px] text-[var(--text-tertiary)]">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Reports */}
      {reports.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-tertiary)] text-[13px]">
          No autopsy reports yet. Reports are generated automatically when CI failures occur.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const severity = report.failure_type === "runtime_error" || report.failure_type === "build_error" ? "High"
              : report.failure_type === "test_failure" ? "Medium" : "Low";
            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden"
              >
                <div
                  className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                  onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                >
                  <div className="flex items-center gap-3">
                    {expandedReport === report.id ? (
                      <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                    )}
                    <div>
                      <div className="text-[14px] font-semibold text-[var(--text-primary)]">
                        {report.error_message?.substring(0, 80) || "CI Failure"}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[var(--text-tertiary)] mt-0.5">
                        <span>{report.workflow_name || report.failure_type}</span>
                        <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" />{report.branch || "main"}</span>
                        <span>{formatRelativeTime(report.created_at)}</span>
                        {report.repo_name && <span>{report.repo_name}</span>}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    severity === "High" ? "bg-red-50 text-red-700 border border-red-200"
                    : severity === "Medium" ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-green-50 text-green-700 border border-green-200"
                  }`}>
                    {severity}
                  </span>
                </div>

                {expandedReport === report.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-5 pb-5 border-t border-[var(--border-default)] pt-4"
                  >
                    <div className="mb-4">
                      <h3 className="text-[12px] font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-2">Root Cause Analysis</h3>
                      <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-secondary)] rounded-lg p-3">
                        {report.error_pattern || report.error_message}
                      </p>
                    </div>

                    {report.stack_trace && (
                      <div className="mb-4">
                        <h3 className="text-[12px] font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-2">Stack Trace</h3>
                        <pre className="text-[11px] font-mono text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-lg p-3 overflow-x-auto max-h-40">
                          {report.stack_trace}
                        </pre>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h3 className="text-[12px] font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-2">Category</h3>
                        <div className="text-[12px] text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded px-2 py-1">
                          {report.category || report.failure_type || "Unknown"}
                        </div>
                      </div>
                      {report.fingerprint_hash && (
                        <div>
                          <h3 className="text-[12px] font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-2">Fingerprint</h3>
                          <div className="bg-[var(--bg-secondary)] rounded-lg p-3">
                            <div className="text-[12px] font-mono text-indigo-600 mb-1">{report.fingerprint_hash}</div>
                            <div className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                              <History className="w-3 h-3" />
                              Matched {report.historical_matches || 0} times · {report.resolution_confidence || 0}% confidence
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {report.patch_summary && (
                      <div>
                        <h3 className="text-[12px] font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-2">Repair Summary</h3>
                        <p className="text-[12px] text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-lg p-3">
                          {report.patch_summary}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-lg text-center">
        <p className="text-[13px] text-[var(--text-secondary)]">
          Autopsy reports are free on all plans. Only automated patch application requires a Pro or Team subscription.
        </p>
      </div>
    </div>
  );
}
