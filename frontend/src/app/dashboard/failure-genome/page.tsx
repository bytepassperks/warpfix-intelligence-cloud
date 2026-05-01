"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  Dna, TrendingUp, Globe, Hash, Clock, BarChart3,
  ChevronDown, ChevronUp, ArrowUpRight, Shield, Layers,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

const GENOME_STATS = [
  { label: "Total Fingerprints", value: "12,847", icon: Dna, change: "+342 this month", color: "text-violet-600" },
  { label: "Unique Error Patterns", value: "4,219", icon: Hash, change: "+89 new patterns", color: "text-blue-600" },
  { label: "Cross-Repo Matches", value: "67,431", icon: Globe, change: "5.2x avg reuse", color: "text-emerald-600" },
  { label: "Avg Fix Time (cached)", value: "0.8s", icon: Clock, change: "vs 6.2min manual", color: "text-amber-600" },
];

const TOP_FINGERPRINTS = [
  {
    hash: "fp_e8a3f2c1", pattern: "TypeError: Cannot read properties of undefined",
    framework: "React/Next.js", category: "runtime_error",
    matches: 2847, repos: 342, medianFixTime: "0.6s", autoResolved: 94,
    trend: "stable", lastSeen: "2 hours ago",
    topFix: "Add optional chaining or null check before property access",
  },
  {
    hash: "fp_b7d4e912", pattern: "Module not found: Can't resolve",
    framework: "Webpack/Vite", category: "build_error",
    matches: 1923, repos: 289, medianFixTime: "1.2s", autoResolved: 87,
    trend: "rising", lastSeen: "45 minutes ago",
    topFix: "Install missing dependency or fix import path",
  },
  {
    hash: "fp_c1a9f3e5", pattern: "ESLint: Unexpected token",
    framework: "ESLint", category: "lint_error",
    matches: 1654, repos: 412, medianFixTime: "0.3s", autoResolved: 99,
    trend: "declining", lastSeen: "1 hour ago",
    topFix: "Auto-fix via ESLint --fix (zero LLM cost)",
  },
  {
    hash: "fp_d2b8c4f7", pattern: "ENOMEM: not enough memory",
    framework: "Node.js/Docker", category: "resource_error",
    matches: 892, repos: 156, medianFixTime: "2.1s", autoResolved: 71,
    trend: "rising", lastSeen: "3 hours ago",
    topFix: "Increase heap size or optimize memory-intensive operations",
  },
  {
    hash: "fp_a5e7d1b3", pattern: "TS2345: Argument of type .* is not assignable",
    framework: "TypeScript", category: "type_error",
    matches: 3241, repos: 521, medianFixTime: "1.8s", autoResolved: 82,
    trend: "stable", lastSeen: "30 minutes ago",
    topFix: "Add proper type assertion or update function signature",
  },
  {
    hash: "fp_f9c2a4d6", pattern: "ENOENT: no such file or directory",
    framework: "Node.js/CI", category: "filesystem_error",
    matches: 1187, repos: 234, medianFixTime: "0.9s", autoResolved: 91,
    trend: "declining", lastSeen: "5 hours ago",
    topFix: "Create missing directory or fix path reference",
  },
];

const MONTHLY_INDEX = [
  { month: "Apr 2026", newPatterns: 342, totalMatches: 8921, avgConfidence: 87, topCategory: "type_error" },
  { month: "Mar 2026", newPatterns: 298, totalMatches: 7843, avgConfidence: 85, topCategory: "build_error" },
  { month: "Feb 2026", newPatterns: 267, totalMatches: 6512, avgConfidence: 83, topCategory: "runtime_error" },
  { month: "Jan 2026", newPatterns: 231, totalMatches: 5234, avgConfidence: 81, topCategory: "lint_error" },
];

const CATEGORY_BREAKDOWN = [
  { category: "Type Errors", count: 3241, pct: 25, color: "bg-blue-500" },
  { category: "Runtime Errors", count: 2847, pct: 22, color: "bg-red-500" },
  { category: "Build Errors", count: 2156, pct: 17, color: "bg-amber-500" },
  { category: "Lint Errors", count: 1892, pct: 15, color: "bg-emerald-500" },
  { category: "Filesystem Errors", count: 1187, pct: 9, color: "bg-purple-500" },
  { category: "Resource Errors", count: 892, pct: 7, color: "bg-orange-500" },
  { category: "Other", count: 632, pct: 5, color: "bg-gray-400" },
];

export default function FailureGenomePage() {
  const [expandedFp, setExpandedFp] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"index" | "explorer" | "categories">("index");

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
        <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Dna className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">CI Failure Genome</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Proprietary database of CI failure patterns — growing smarter with every repo
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Stats */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {GENOME_STATS.map((s, i) => (
          <motion.div key={s.label} variants={fadeUp} custom={i}
            className="p-4 rounded-xl border border-[var(--border-default)] bg-white">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-[var(--text-secondary)]">{s.label}</span>
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-emerald-600 mt-1">{s.change}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Info banner */}
      <div className="p-4 rounded-xl bg-violet-50 border border-violet-200">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-violet-900">How the CI Failure Genome Works</p>
            <p className="text-xs text-violet-700 mt-1">
              Every CI failure processed by WarpFix is normalized, hashed, and stored as a fingerprint.
              Validated fixes are linked to their fingerprints with confidence scores.
              When the same pattern recurs — in your repo or across the network — the proven fix is applied instantly.
              Human edits to WarpFix PRs teach the system where fixes were imperfect, improving accuracy over time.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-default)]">
        {[
          { id: "index" as const, label: "Failure Index" },
          { id: "explorer" as const, label: "Fingerprint Explorer" },
          { id: "categories" as const, label: "Category Breakdown" },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Failure Index */}
      {activeTab === "index" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-600" />
              Monthly CI Failure Index
            </h2>
            <span className="text-xs text-[var(--text-secondary)]">Public transparency report</span>
          </div>
          <div className="rounded-xl border border-[var(--border-default)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-secondary)]">
                  <th className="text-left p-3 font-medium">Month</th>
                  <th className="text-right p-3 font-medium">New Patterns</th>
                  <th className="text-right p-3 font-medium">Total Matches</th>
                  <th className="text-right p-3 font-medium">Avg Confidence</th>
                  <th className="text-right p-3 font-medium">Top Category</th>
                </tr>
              </thead>
              <tbody>
                {MONTHLY_INDEX.map((m) => (
                  <tr key={m.month} className="border-t border-[var(--border-default)]">
                    <td className="p-3 font-medium">{m.month}</td>
                    <td className="p-3 text-right text-violet-600">+{m.newPatterns}</td>
                    <td className="p-3 text-right">{m.totalMatches.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        m.avgConfidence >= 85 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>{m.avgConfidence}%</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-xs">{m.topCategory.replace("_", " ")}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            The CI Failure Index is a monthly transparency report showing the most common CI failure patterns across the WarpFix network.
            All data is anonymized — no repo names, file paths, or code content is exposed.
          </p>
        </div>
      )}

      {/* Tab: Fingerprint Explorer */}
      {activeTab === "explorer" && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5 text-violet-600" />
            Top Fingerprints by Match Count
          </h2>
          {TOP_FINGERPRINTS.map((fp) => (
            <div key={fp.hash}
              className="rounded-xl border border-[var(--border-default)] bg-white overflow-hidden">
              <button
                onClick={() => setExpandedFp(expandedFp === fp.hash ? null : fp.hash)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded font-mono">{fp.hash}</code>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      fp.category === "runtime_error" ? "bg-red-100 text-red-700" :
                      fp.category === "build_error" ? "bg-amber-100 text-amber-700" :
                      fp.category === "type_error" ? "bg-blue-100 text-blue-700" :
                      fp.category === "lint_error" ? "bg-emerald-100 text-emerald-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>{fp.category.replace("_", " ")}</span>
                    <span className={`text-xs ${
                      fp.trend === "rising" ? "text-red-600" : fp.trend === "declining" ? "text-emerald-600" : "text-gray-500"
                    }`}>
                      {fp.trend === "rising" ? "↑ rising" : fp.trend === "declining" ? "↓ declining" : "→ stable"}
                    </span>
                  </div>
                  <p className="text-sm font-mono text-[var(--text-primary)] truncate">{fp.pattern}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{fp.framework} · Last seen {fp.lastSeen}</p>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <div className="text-right">
                    <div className="text-lg font-bold">{fp.matches.toLocaleString()}</div>
                    <div className="text-xs text-[var(--text-secondary)]">matches</div>
                  </div>
                  {expandedFp === fp.hash ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>
              {expandedFp === fp.hash && (
                <div className="p-4 border-t border-[var(--border-default)] bg-[var(--bg-secondary)]">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-[var(--text-secondary)]">Repos Affected</div>
                      <div className="text-lg font-semibold">{fp.repos}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-secondary)]">Median Fix Time</div>
                      <div className="text-lg font-semibold">{fp.medianFixTime}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-secondary)]">Auto-Resolved</div>
                      <div className="text-lg font-semibold text-emerald-600">{fp.autoResolved}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--text-secondary)]">Reuse Factor</div>
                      <div className="text-lg font-semibold">{(fp.matches / fp.repos).toFixed(1)}x</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-[var(--border-default)]">
                    <div className="text-xs font-medium text-[var(--text-secondary)] mb-1">Most Common Fix</div>
                    <p className="text-sm">{fp.topFix}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Category Breakdown */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Failure Categories</h2>
          <div className="space-y-3">
            {CATEGORY_BREAKDOWN.map((cat) => (
              <div key={cat.category} className="flex items-center gap-4">
                <div className="w-32 text-sm font-medium">{cat.category}</div>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${cat.color} rounded-full flex items-center justify-end pr-2`}
                    style={{ width: `${cat.pct}%` }}>
                    {cat.pct >= 10 && <span className="text-[10px] text-white font-medium">{cat.pct}%</span>}
                  </div>
                </div>
                <div className="w-16 text-right text-sm text-[var(--text-secondary)]">{cat.count.toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Data Flywheel Effect</p>
                <p className="text-xs text-blue-700 mt-1">
                  Every CI failure processed makes WarpFix smarter. With {GENOME_STATS[0].value} fingerprints across
                  {" "}{GENOME_STATS[2].value} matches, WarpFix has a fix accuracy that competitors starting from zero
                  would need 2-3 years of active adoption to replicate. Your fixes improve because the network grows.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-[var(--border-default)]">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="w-4 h-4 text-violet-600" />
                <span className="text-sm font-medium">Compounding Advantage</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Each new repo that joins WarpFix contributes failure patterns that benefit every other user.
                A newcomer starting today cannot replicate this dataset.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-default)]">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Anonymous & Secure</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                All patterns are normalized and anonymized. No repo names, file paths, or code content
                leaves your organization. Only abstract error patterns and fix templates are shared.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-default)]">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium">Instant Fix Reuse</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                When a fingerprint matches a known pattern, the validated fix is applied in under 1 second —
                no LLM call needed. That is 400x faster than generating a new fix from scratch.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
