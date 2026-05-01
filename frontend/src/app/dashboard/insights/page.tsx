"use client";

import { motion } from "framer-motion";
import { Fingerprint, FlaskConical, Clock, FileWarning, TrendingUp, BarChart3, AlertTriangle } from "lucide-react";
import { useState } from "react";

const TABS = ["Fingerprints", "Flaky Tests", "Slowest Jobs", "Failure-Prone Files"] as const;

const FINGERPRINTS = [
  { hash: "a3f8c2d1", pattern: "TypeError: Cannot read property 'map' of undefined", count: 47, lastSeen: "2h ago", confidence: 94 },
  { hash: "b7e4f9a2", pattern: "ENOENT: no such file or directory, open './config.json'", count: 31, lastSeen: "5h ago", confidence: 88 },
  { hash: "c1d5e8f3", pattern: "Module not found: Can't resolve '@/utils/helpers'", count: 24, lastSeen: "1d ago", confidence: 91 },
  { hash: "d9a2b6c4", pattern: "Error: Timeout - Async callback was not invoked within 5000ms", count: 19, lastSeen: "3h ago", confidence: 72 },
  { hash: "e3f7a1b5", pattern: "SyntaxError: Unexpected token '<' in JSON at position 0", count: 15, lastSeen: "12h ago", confidence: 85 },
  { hash: "f6c8d2e7", pattern: "AssertionError: expected 200 to equal 404", count: 12, lastSeen: "2d ago", confidence: 67 },
];

const FLAKY_TESTS = [
  { name: "should render dashboard with user data", file: "src/dashboard.test.ts", flakeRate: 23, runs: 120, lastFlake: "1h ago" },
  { name: "handles concurrent API requests", file: "src/api/client.test.ts", flakeRate: 18, runs: 85, lastFlake: "3h ago" },
  { name: "WebSocket reconnection on timeout", file: "src/ws/socket.test.ts", flakeRate: 15, runs: 200, lastFlake: "6h ago" },
  { name: "renders chart with animation", file: "src/components/chart.test.tsx", flakeRate: 12, runs: 150, lastFlake: "1d ago" },
  { name: "database migration rollback", file: "tests/migration.test.ts", flakeRate: 8, runs: 60, lastFlake: "2d ago" },
];

const SLOWEST_JOBS = [
  { name: "E2E Tests (Playwright)", duration: "8m 42s", avg: "7m 15s", trend: "+19%", runs: 340 },
  { name: "Integration Tests", duration: "5m 18s", avg: "4m 50s", trend: "+10%", runs: 280 },
  { name: "Build & Bundle", duration: "3m 45s", avg: "3m 30s", trend: "+4%", runs: 500 },
  { name: "Lint & Type Check", duration: "1m 22s", avg: "1m 10s", trend: "+10%", runs: 500 },
  { name: "Unit Tests", duration: "0m 58s", avg: "0m 52s", trend: "+12%", runs: 500 },
];

const FAILURE_FILES = [
  { path: "src/services/api-client.ts", failures: 34, pct: 22, lastFail: "2h ago" },
  { path: "src/components/Dashboard.tsx", failures: 28, pct: 18, lastFail: "4h ago" },
  { path: "src/utils/date-formatter.ts", failures: 19, pct: 12, lastFail: "1d ago" },
  { path: "src/hooks/useAuth.ts", failures: 15, pct: 10, lastFail: "6h ago" },
  { path: "tests/fixtures/mock-data.ts", failures: 12, pct: 8, lastFail: "2d ago" },
];

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("Fingerprints");

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Insights Dashboard</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Unlimited analytics across all your repositories — fingerprints, flaky tests, performance trends, and failure hotspots.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Unique Fingerprints", value: "148", icon: Fingerprint, color: "text-indigo-600" },
          { label: "Flaky Tests Detected", value: "23", icon: FlaskConical, color: "text-amber-600" },
          { label: "Avg CI Duration", value: "6m 12s", icon: Clock, color: "text-blue-600" },
          { label: "Failure-Prone Files", value: "37", icon: FileWarning, color: "text-red-600" },
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

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 bg-[var(--bg-secondary)] rounded-lg mb-6 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-[13px] font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Fingerprints" && (
        <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-default)] flex items-center justify-between">
            <span className="text-[13px] font-semibold">Top Failing Fingerprints</span>
            <span className="text-[11px] text-[var(--text-tertiary)]">148 unique patterns</span>
          </div>
          <div className="divide-y divide-[var(--border-default)]">
            {FINGERPRINTS.map((fp) => (
              <div key={fp.hash} className="px-5 py-4 hover:bg-[var(--bg-secondary)] transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <code className="text-[12px] text-indigo-600 font-mono">{fp.hash}</code>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[var(--text-tertiary)]">{fp.lastSeen}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      fp.confidence >= 85 ? "bg-green-50 text-green-700" : fp.confidence >= 70 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                    }`}>
                      {fp.confidence}% confidence
                    </span>
                  </div>
                </div>
                <div className="text-[13px] text-[var(--text-primary)] font-mono mb-1">{fp.pattern}</div>
                <div className="flex items-center gap-4 text-[11px] text-[var(--text-tertiary)]">
                  <span><TrendingUp className="w-3 h-3 inline mr-1" />Matched {fp.count} times</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "Flaky Tests" && (
        <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-default)] flex items-center justify-between">
            <span className="text-[13px] font-semibold">Flaky Test Detection</span>
            <span className="text-[11px] text-[var(--text-tertiary)]">Heuristic analysis from CI history</span>
          </div>
          <div className="divide-y divide-[var(--border-default)]">
            {FLAKY_TESTS.map((test) => (
              <div key={test.name} className="px-5 py-4 hover:bg-[var(--bg-secondary)] transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">{test.name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    test.flakeRate > 15 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {test.flakeRate}% flake rate
                  </span>
                </div>
                <div className="text-[12px] text-[var(--text-tertiary)] font-mono mb-2">{test.file}</div>
                <div className="flex items-center gap-4 text-[11px] text-[var(--text-tertiary)]">
                  <span>{test.runs} runs analyzed</span>
                  <span>Last flake: {test.lastFlake}</span>
                </div>
                <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${test.flakeRate > 15 ? "bg-red-400" : "bg-amber-400"}`} style={{ width: `${test.flakeRate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "Slowest Jobs" && (
        <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-default)] flex items-center justify-between">
            <span className="text-[13px] font-semibold">Slowest CI Jobs</span>
            <span className="text-[11px] text-[var(--text-tertiary)]">Last 30 days</span>
          </div>
          <div className="divide-y divide-[var(--border-default)]">
            {SLOWEST_JOBS.map((job) => (
              <div key={job.name} className="px-5 py-4 hover:bg-[var(--bg-secondary)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">{job.name}</span>
                  <span className="text-[14px] font-semibold text-[var(--text-primary)] font-mono">{job.duration}</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-[var(--text-tertiary)]">
                  <span>Avg: {job.avg}</span>
                  <span className="text-red-600 font-medium">{job.trend} slower</span>
                  <span>{job.runs} runs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "Failure-Prone Files" && (
        <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-default)] flex items-center justify-between">
            <span className="text-[13px] font-semibold">Most Failure-Prone Files</span>
            <span className="text-[11px] text-[var(--text-tertiary)]">Files that cause the most CI failures</span>
          </div>
          <div className="divide-y divide-[var(--border-default)]">
            {FAILURE_FILES.map((file) => (
              <div key={file.path} className="px-5 py-4 hover:bg-[var(--bg-secondary)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-mono text-[var(--text-primary)]">{file.path}</span>
                  <span className="text-[12px] font-semibold text-red-600">{file.failures} failures</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-[var(--text-tertiary)]">
                  <span>{file.pct}% of total failures</span>
                  <span>Last failure: {file.lastFail}</span>
                </div>
                <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${file.pct * 3}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-center">
        <p className="text-[13px] text-[var(--text-secondary)]">
          Insights are unlimited on all plans. Upgrade to Pro for automated repairs.
        </p>
      </div>
    </div>
  );
}
