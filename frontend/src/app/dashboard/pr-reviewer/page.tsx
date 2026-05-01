"use client";

import { motion } from "framer-motion";
import { MessageSquare, Eye, Shield, Zap, CheckCircle2, FileCode, Code2, ArrowRight, GitPullRequest } from "lucide-react";
import { useState } from "react";

const REVIEW_TABS = ["Recent Reviews", "Static Analysis", "Settings"] as const;

const RECENT_REVIEWS = [
  {
    pr: "#847",
    title: "feat: add user preferences API",
    repo: "warpfix/demo-app",
    files: 4,
    comments: 7,
    severity: { high: 1, medium: 2, low: 4 },
    status: "reviewed",
    time: "12m ago",
    summary: "Added null check for preferences object, suggested input validation for email field, flagged missing rate limiting on new endpoint.",
  },
  {
    pr: "#845",
    title: "fix: resolve race condition in WebSocket handler",
    repo: "warpfix/demo-app",
    files: 2,
    comments: 3,
    severity: { high: 0, medium: 1, low: 2 },
    status: "reviewed",
    time: "1h ago",
    summary: "Race condition fix looks correct. Suggested adding mutex timeout and cleanup on disconnect.",
  },
  {
    pr: "#843",
    title: "refactor: migrate to ES modules",
    repo: "warpfix/demo-app",
    files: 12,
    comments: 15,
    severity: { high: 0, medium: 3, low: 12 },
    status: "reviewed",
    time: "3h ago",
    summary: "ES module migration is clean. 3 files still use require() — flagged for manual review. Import ordering needs cleanup in 4 files.",
  },
];

const SAST_FINDINGS = [
  { rule: "no-eval", tool: "ESLint", severity: "critical", file: "src/utils/parser.ts:42", desc: "eval() usage detected — potential code injection", suggestion: "Replace eval() with JSON.parse() or a safe expression parser" },
  { rule: "sql-injection", tool: "Semgrep", severity: "high", file: "src/api/users.ts:89", desc: "Unsanitized user input in SQL query", suggestion: "Use parameterized queries: db.query('SELECT * FROM users WHERE id = $1', [userId])" },
  { rule: "hardcoded-secret", tool: "Gitleaks", severity: "high", file: "src/config/api.ts:12", desc: "Potential API key hardcoded in source", suggestion: "Move to environment variable: process.env.API_KEY" },
  { rule: "prototype-pollution", tool: "Semgrep", severity: "medium", file: "src/utils/merge.ts:15", desc: "Object.assign with user-controlled input", suggestion: "Use structuredClone() or lodash.merge with prototype pollution guard" },
  { rule: "no-console", tool: "ESLint", severity: "low", file: "src/services/logger.ts:28", desc: "console.log in production code", suggestion: "Replace with structured logger: logger.info()" },
];

export default function PrReviewerPage() {
  const [activeTab, setActiveTab] = useState<typeof REVIEW_TABS[number]>("Recent Reviews");
  const [expandedPr, setExpandedPr] = useState<string | null>(null);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">PR Reviewer</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Always-on PR review — even when CI is green. Line-by-line comments, security analysis, and one-click apply suggestions.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "PRs Reviewed", value: "142", icon: GitPullRequest, color: "text-indigo-600" },
          { label: "Issues Found", value: "387", icon: Eye, color: "text-amber-600" },
          { label: "Auto-Fixed", value: "201", icon: CheckCircle2, color: "text-green-600" },
          { label: "Critical Blocked", value: "12", icon: Shield, color: "text-red-600" },
        ].map((card) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-[var(--border-default)] p-4">
            <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
            <div className="text-xl font-bold text-[var(--text-primary)]">{card.value}</div>
            <div className="text-[12px] text-[var(--text-tertiary)]">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* How it works */}
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        {[
          { icon: Eye, title: "Always-On Review", desc: "Every PR gets a summary + inline comments. Free tier: high-level summary. Paid: deep analysis with security, perf, edge cases.", color: "text-indigo-600" },
          { icon: Shield, title: "Signal-First SAST", desc: "Curated open-source tools (ESLint, Semgrep, Gitleaks) run in sandbox. LLM only summarizes and filters findings.", color: "text-green-600" },
          { icon: Code2, title: "One-Click Apply", desc: "Every suggestion generates a GitHub suggestion block. Users can apply fixes without leaving the PR.", color: "text-blue-600" },
        ].map((item) => (
          <div key={item.title} className="bg-white rounded-xl border border-[var(--border-default)] p-4">
            <item.icon className={`w-5 h-5 ${item.color} mb-2`} />
            <div className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">{item.title}</div>
            <div className="text-[12px] text-[var(--text-tertiary)]">{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[var(--bg-secondary)] rounded-lg mb-6 w-fit">
        {REVIEW_TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md text-[13px] font-medium transition-colors ${
            activeTab === tab ? "bg-white text-[var(--text-primary)] shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          }`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Recent Reviews" && (
        <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-default)]">
            <span className="text-[13px] font-semibold">Recent PR Reviews</span>
          </div>
          <div className="divide-y divide-[var(--border-default)]">
            {RECENT_REVIEWS.map((review) => (
              <div key={review.pr}>
                <div className="px-5 py-4 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer" onClick={() => setExpandedPr(expandedPr === review.pr ? null : review.pr)}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-indigo-600">{review.pr}</span>
                      <span className="text-[13px] font-medium text-[var(--text-primary)]">{review.title}</span>
                    </div>
                    <span className="text-[11px] text-[var(--text-tertiary)]">{review.time}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-[var(--text-tertiary)]">
                    <span>{review.repo}</span>
                    <span>{review.files} files</span>
                    <span>{review.comments} comments</span>
                    <div className="flex gap-1">
                      {review.severity.high > 0 && <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-[9px] font-medium">{review.severity.high} high</span>}
                      {review.severity.medium > 0 && <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-medium">{review.severity.medium} med</span>}
                      {review.severity.low > 0 && <span className="px-1.5 py-0.5 rounded bg-gray-50 text-gray-600 text-[9px] font-medium">{review.severity.low} low</span>}
                    </div>
                  </div>
                </div>
                {expandedPr === review.pr && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-4">
                    <div className="bg-[var(--bg-secondary)] rounded-lg p-3 text-[12px] text-[var(--text-secondary)]">
                      {review.summary}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "Static Analysis" && (
        <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-default)] flex items-center justify-between">
            <span className="text-[13px] font-semibold">SAST Findings</span>
            <span className="text-[11px] text-[var(--text-tertiary)]">ESLint + Semgrep + Gitleaks</span>
          </div>
          <div className="divide-y divide-[var(--border-default)]">
            {SAST_FINDINGS.map((finding, i) => (
              <div key={i} className="px-5 py-4 hover:bg-[var(--bg-secondary)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-100 text-[var(--text-secondary)]">{finding.rule}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">{finding.tool}</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    finding.severity === "critical" ? "bg-red-100 text-red-800" : finding.severity === "high" ? "bg-red-50 text-red-700" : finding.severity === "medium" ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-600"
                  }`}>
                    {finding.severity}
                  </span>
                </div>
                <div className="text-[12px] font-mono text-[var(--text-tertiary)] mb-1">{finding.file}</div>
                <div className="text-[12px] text-[var(--text-secondary)] mb-2">{finding.desc}</div>
                <div className="bg-green-50 border border-green-100 rounded p-2 text-[11px] text-green-800">
                  <Zap className="w-3 h-3 inline mr-1" />
                  {finding.suggestion}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "Settings" && (
        <div className="bg-white rounded-xl border border-[var(--border-default)] p-6">
          <h3 className="text-[15px] font-semibold text-[var(--text-primary)] mb-4">PR Review Settings</h3>
          <div className="space-y-4">
            {[
              { label: "Auto-review all PRs", desc: "Automatically review every PR when it's opened or updated", enabled: true },
              { label: "Include security analysis", desc: "Run SAST tools (ESLint, Semgrep, Gitleaks) on every review", enabled: true },
              { label: "Generate suggestion blocks", desc: "Create one-click apply suggestions for fixable issues", enabled: true },
              { label: "Post PR summary", desc: "Add a high-level summary comment on every reviewed PR", enabled: true },
              { label: "Block on critical findings", desc: "Request changes if critical security issues are found", enabled: false },
            ].map((setting) => (
              <div key={setting.label} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg">
                <div>
                  <div className="text-[13px] font-medium text-[var(--text-primary)]">{setting.label}</div>
                  <div className="text-[12px] text-[var(--text-tertiary)]">{setting.desc}</div>
                </div>
                <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${setting.enabled ? "bg-green-500" : "bg-gray-300"}`}>
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${setting.enabled ? "right-0.5" : "left-0.5"}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-center">
        <p className="text-[13px] text-[var(--text-secondary)]">
          Free tier: basic summary on all PRs. Pro: deep analysis with security, performance, and edge case detection.
        </p>
      </div>
    </div>
  );
}
