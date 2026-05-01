"use client";

import { motion } from "framer-motion";
import { FileSearch, GitBranch, History, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

const AUTOPSY_REPORTS = [
  {
    id: 1,
    title: "TypeError in Dashboard API handler",
    severity: "High",
    timestamp: "2h ago",
    workflow: "CI / test",
    branch: "feature/user-profiles",
    rootCause: "The user.preferences object can be null when a new user hasn't configured their settings yet. The code at src/api/dashboard.ts:142 calls user.preferences.theme without a null check, causing a TypeError when processing API requests for newly registered users.",
    affectedFiles: ["src/api/dashboard.ts", "src/types/user.ts", "src/middleware/auth.ts"],
    fingerprint: "a3f8c2d1",
    historicalMatches: 12,
    suggestedSteps: [
      "Add optional chaining: user.preferences?.theme ?? 'default'",
      "Add null check guard at the API handler entry point",
      "Update User type to mark preferences as optional",
      "Add integration test for new user without preferences",
    ],
  },
  {
    id: 2,
    title: "ESLint import order violation",
    severity: "Low",
    timestamp: "5h ago",
    workflow: "CI / lint",
    branch: "main",
    rootCause: "The import statement for lodash was added after the local imports in src/utils/transform.ts:3, violating the project's import ordering rule (external imports must come before local imports).",
    affectedFiles: ["src/utils/transform.ts"],
    fingerprint: "e8b3c4f1",
    historicalMatches: 34,
    suggestedSteps: [
      "Move lodash import above local imports",
      "Run eslint --fix to auto-sort imports",
      "Consider adding eslint-plugin-import to pre-commit hooks",
    ],
  },
  {
    id: 3,
    title: "Docker build OOM during bundle",
    severity: "Medium",
    timestamp: "1d ago",
    workflow: "CI / build",
    branch: "release/v2.1",
    rootCause: "The webpack build process ran out of memory (heap limit reached at 512MB) while bundling the application. The bundle size has grown significantly due to the addition of three new chart libraries in the analytics module (d3, recharts, and victory).",
    affectedFiles: ["webpack.config.js", "src/analytics/index.ts", "Dockerfile"],
    fingerprint: "f2a9d7e5",
    historicalMatches: 3,
    suggestedSteps: [
      "Increase Node.js memory limit: --max-old-space-size=4096",
      "Use dynamic imports for chart libraries to enable code splitting",
      "Remove duplicate chart libraries — pick one (recharts recommended)",
      "Add memory monitoring to CI pipeline",
    ],
  },
];

export default function AutopsyPage() {
  const [expandedReport, setExpandedReport] = useState<number | null>(1);

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
          { label: "Reports Generated", value: "247", icon: FileSearch, color: "text-indigo-600" },
          { label: "Unique Root Causes", value: "89", icon: AlertTriangle, color: "text-amber-600" },
          { label: "Auto-Resolved", value: "73%", icon: CheckCircle2, color: "text-green-600" },
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
      <div className="space-y-3">
        {AUTOPSY_REPORTS.map((report) => (
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
                  <div className="text-[14px] font-semibold text-[var(--text-primary)]">{report.title}</div>
                  <div className="flex items-center gap-3 text-[11px] text-[var(--text-tertiary)] mt-0.5">
                    <span>{report.workflow}</span>
                    <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" />{report.branch}</span>
                    <span>{report.timestamp}</span>
                  </div>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                report.severity === "High" ? "bg-red-50 text-red-700 border border-red-200"
                : report.severity === "Medium" ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-green-50 text-green-700 border border-green-200"
              }`}>
                {report.severity}
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
                    {report.rootCause}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="text-[12px] font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-2">Affected Files</h3>
                    <div className="space-y-1">
                      {report.affectedFiles.map((file) => (
                        <div key={file} className="text-[12px] font-mono text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded px-2 py-1">
                          {file}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[12px] font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-2">Fingerprint</h3>
                    <div className="bg-[var(--bg-secondary)] rounded-lg p-3">
                      <div className="text-[12px] font-mono text-indigo-600 mb-1">{report.fingerprint}</div>
                      <div className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
                        <History className="w-3 h-3" />
                        Matched {report.historicalMatches} times across your repos
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[12px] font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-2">Suggested Next Steps</h3>
                  <div className="space-y-1.5">
                    {report.suggestedSteps.map((step, i) => (
                      <div key={i} className="flex items-start gap-2 text-[12px] text-[var(--text-secondary)]">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-lg text-center">
        <p className="text-[13px] text-[var(--text-secondary)]">
          Autopsy reports are free on all plans. Only automated patch application requires a Pro or Team subscription.
        </p>
      </div>
    </div>
  );
}
