"use client";

import { motion } from "framer-motion";
import { FlaskConical, TrendingDown, TrendingUp, Clock, BarChart3, AlertTriangle, Shield, RefreshCw } from "lucide-react";
import { useState } from "react";

const FLAKY_TESTS = [
  { name: "should render dashboard with user data", file: "src/__tests__/dashboard.test.tsx", flakeRate: 23, totalRuns: 120, failures: 28, lastFlake: "1h ago", trend: "up", suggestion: "Add explicit waitFor() before assertions — DOM may not be ready when assertions run." },
  { name: "handles concurrent API requests gracefully", file: "src/api/__tests__/client.test.ts", flakeRate: 18, totalRuns: 85, failures: 15, lastFlake: "3h ago", trend: "stable", suggestion: "Mock network latency deterministically. Use fake timers instead of real delays." },
  { name: "WebSocket reconnection on timeout", file: "src/ws/__tests__/socket.test.ts", flakeRate: 15, totalRuns: 200, failures: 30, lastFlake: "6h ago", trend: "down", suggestion: "Replace real WebSocket with mock. Current test depends on network timing." },
  { name: "renders chart animation correctly", file: "src/components/__tests__/chart.test.tsx", flakeRate: 12, totalRuns: 150, failures: 18, lastFlake: "1d ago", trend: "up", suggestion: "Disable animations in test environment or use jest.useFakeTimers() for requestAnimationFrame." },
  { name: "database migration rollback", file: "tests/integration/migration.test.ts", flakeRate: 8, totalRuns: 60, failures: 5, lastFlake: "2d ago", trend: "stable", suggestion: "Use isolated test database per run. Current setup shares state between parallel tests." },
  { name: "file upload progress tracking", file: "src/upload/__tests__/progress.test.ts", flakeRate: 6, totalRuns: 90, failures: 5, lastFlake: "3d ago", trend: "down", suggestion: "Mock XMLHttpRequest.upload events instead of relying on actual file I/O timing." },
  { name: "SSR hydration mismatch check", file: "tests/ssr/hydration.test.tsx", flakeRate: 4, totalRuns: 200, failures: 8, lastFlake: "5d ago", trend: "down", suggestion: "Suppress Date.now() and Math.random() during SSR to eliminate non-determinism." },
];

const STRATEGIES = [
  { icon: RefreshCw, title: "Quarantine", desc: "Automatically isolate flaky tests so they don't block CI. Re-run separately with diagnostics.", color: "text-amber-600" },
  { icon: Shield, title: "Auto-Retry", desc: "Retry flaky tests up to 3 times before marking as failed. Reduces false negatives by 80%.", color: "text-blue-600" },
  { icon: BarChart3, title: "Trend Analysis", desc: "Track flakiness over time. Alert when a previously stable test starts flaking.", color: "text-indigo-600" },
];

export default function FlakyTestsPage() {
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"flakeRate" | "failures" | "recent">("flakeRate");

  const sorted = [...FLAKY_TESTS].sort((a, b) => {
    if (sortBy === "flakeRate") return b.flakeRate - a.flakeRate;
    if (sortBy === "failures") return b.failures - a.failures;
    return 0;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Flaky Test Detection</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Heuristic analysis of CI history to identify non-deterministic tests. No LLM required — pure statistics over past runs.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Flaky Tests", value: "7", icon: FlaskConical, color: "text-amber-600" },
          { label: "Total Flake Events", value: "109", icon: AlertTriangle, color: "text-red-600" },
          { label: "CI Time Wasted", value: "~4.2h", icon: Clock, color: "text-blue-600" },
          { label: "Avg Flake Rate", value: "12.3%", icon: BarChart3, color: "text-indigo-600" },
        ].map((card) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-[var(--border-default)] p-4">
            <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
            <div className="text-xl font-bold text-[var(--text-primary)]">{card.value}</div>
            <div className="text-[12px] text-[var(--text-tertiary)]">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Strategies */}
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        {STRATEGIES.map((s) => (
          <div key={s.title} className="bg-white rounded-xl border border-[var(--border-default)] p-4">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <div className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">{s.title}</div>
            <div className="text-[12px] text-[var(--text-tertiary)]">{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[12px] text-[var(--text-tertiary)]">Sort by:</span>
        {[
          { key: "flakeRate" as const, label: "Flake Rate" },
          { key: "failures" as const, label: "Total Failures" },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortBy(opt.key)}
            className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
              sortBy === opt.key ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Flaky tests list */}
      <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border-default)] flex items-center justify-between">
          <span className="text-[13px] font-semibold">Detected Flaky Tests</span>
          <span className="text-[11px] text-[var(--text-tertiary)]">Based on last 30 days of CI history</span>
        </div>
        <div className="divide-y divide-[var(--border-default)]">
          {sorted.map((test) => (
            <div key={test.name}>
              <div
                className="px-5 py-4 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                onClick={() => setSelectedTest(selectedTest === test.name ? null : test.name)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">{test.name}</span>
                  <div className="flex items-center gap-2">
                    {test.trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-red-500" />}
                    {test.trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-green-500" />}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      test.flakeRate > 15 ? "bg-red-50 text-red-700 border border-red-200" : test.flakeRate > 8 ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                    }`}>
                      {test.flakeRate}% flaky
                    </span>
                  </div>
                </div>
                <div className="text-[12px] text-[var(--text-tertiary)] font-mono mb-2">{test.file}</div>
                <div className="flex items-center gap-4 text-[11px] text-[var(--text-tertiary)]">
                  <span>{test.totalRuns} runs</span>
                  <span>{test.failures} failures</span>
                  <span>Last flake: {test.lastFlake}</span>
                </div>
                <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${test.flakeRate > 15 ? "bg-red-400" : test.flakeRate > 8 ? "bg-amber-400" : "bg-yellow-400"}`} style={{ width: `${Math.min(test.flakeRate * 3, 100)}%` }} />
                </div>
              </div>
              {selectedTest === test.name && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-4">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                    <div className="text-[11px] font-semibold text-indigo-800 mb-1">Suggested Fix</div>
                    <div className="text-[12px] text-indigo-700">{test.suggestion}</div>
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-lg text-center">
        <p className="text-[13px] text-[var(--text-secondary)]">
          Flaky test detection is free on all plans — no LLM cost, just heuristics on your CI history.
        </p>
      </div>
    </div>
  );
}
