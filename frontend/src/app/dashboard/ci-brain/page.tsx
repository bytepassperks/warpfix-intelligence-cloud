"use client";

import { motion } from "framer-motion";
import { Brain, Fingerprint, Users, FileWarning, GitBranch, Clock, TrendingUp, BarChart3, ArrowRight } from "lucide-react";
import { useState } from "react";

const TABS = ["Test Reliability", "Fingerprint History", "Owner Hotspots"] as const;

const TEST_SCORES = [
  { name: "should process payment correctly", file: "src/payments/__tests__/process.test.ts", score: 99.2, runs: 500, fails: 4, trend: "stable" },
  { name: "renders user profile card", file: "src/components/__tests__/profile.test.tsx", score: 97.8, runs: 320, fails: 7, trend: "stable" },
  { name: "handles WebSocket reconnection", file: "src/ws/__tests__/reconnect.test.ts", score: 85.0, runs: 200, fails: 30, trend: "declining" },
  { name: "concurrent file upload tracking", file: "src/upload/__tests__/concurrent.test.ts", score: 82.3, runs: 150, fails: 27, trend: "declining" },
  { name: "dashboard data aggregation", file: "src/api/__tests__/aggregate.test.ts", score: 77.1, runs: 120, fails: 27, trend: "improving" },
  { name: "E2E checkout flow", file: "tests/e2e/checkout.spec.ts", score: 71.5, runs: 80, fails: 23, trend: "declining" },
  { name: "SSR hydration consistency", file: "tests/ssr/hydration.test.tsx", score: 96.0, runs: 200, fails: 8, trend: "improving" },
];

const FINGERPRINT_HISTORY = [
  { hash: "a3f8c2d1", pattern: "TypeError: Cannot read property of undefined", repos: 4, totalMatches: 47, medianFixTime: "3h", warpfixHandled: 70, firstSeen: "45d ago", lastSeen: "2h ago" },
  { hash: "b7e4f9a2", pattern: "ENOENT: no such file or directory", repos: 6, totalMatches: 31, medianFixTime: "1h", warpfixHandled: 85, firstSeen: "60d ago", lastSeen: "5h ago" },
  { hash: "c1d5e8f3", pattern: "Module not found: Can't resolve", repos: 3, totalMatches: 24, medianFixTime: "45m", warpfixHandled: 92, firstSeen: "30d ago", lastSeen: "1d ago" },
  { hash: "d9a2b6c4", pattern: "Timeout - Async callback not invoked", repos: 2, totalMatches: 19, medianFixTime: "5h", warpfixHandled: 42, firstSeen: "90d ago", lastSeen: "3h ago" },
  { hash: "e3f7a1b5", pattern: "SyntaxError: Unexpected token", repos: 5, totalMatches: 15, medianFixTime: "30m", warpfixHandled: 93, firstSeen: "20d ago", lastSeen: "12h ago" },
];

const HOTSPOTS = [
  { file: "src/services/api-client.ts", owner: "Platform Team", failures: 34, pct: 22, impactedDevs: 8 },
  { file: "src/components/Dashboard.tsx", owner: "Frontend Team", failures: 28, pct: 18, impactedDevs: 5 },
  { file: "src/utils/date-formatter.ts", owner: "Core Team", failures: 19, pct: 12, impactedDevs: 12 },
  { file: "src/hooks/useAuth.ts", owner: "Auth Team", failures: 15, pct: 10, impactedDevs: 15 },
  { file: "tests/fixtures/mock-data.ts", owner: "QA Team", failures: 12, pct: 8, impactedDevs: 6 },
  { file: "src/middleware/rate-limit.ts", owner: "Platform Team", failures: 10, pct: 6, impactedDevs: 3 },
];

const TEAM_IMPACT = [
  { team: "Platform Team", failures: 44, filesOwned: 12, ciMinutesWasted: 340 },
  { team: "Frontend Team", failures: 28, filesOwned: 24, ciMinutesWasted: 210 },
  { team: "Auth Team", failures: 15, filesOwned: 6, ciMinutesWasted: 120 },
  { team: "Core Team", failures: 19, filesOwned: 8, ciMinutesWasted: 150 },
  { team: "QA Team", failures: 12, filesOwned: 15, ciMinutesWasted: 90 },
];

export default function CiBrainPage() {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("Test Reliability");

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
        {[
          { label: "Tests Tracked", value: "1,247", icon: BarChart3, color: "text-indigo-600" },
          { label: "Fingerprints", value: "148", icon: Fingerprint, color: "text-purple-600" },
          { label: "Files Monitored", value: "312", icon: FileWarning, color: "text-amber-600" },
          { label: "Teams Mapped", value: "5", icon: Users, color: "text-blue-600" },
        ].map((card) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-[var(--border-default)] p-4">
            <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
            <div className="text-xl font-bold text-[var(--text-primary)]">{card.value}</div>
            <div className="text-[12px] text-[var(--text-tertiary)]">{card.label}</div>
          </motion.div>
        ))}
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
          </div>
          <div className="divide-y divide-[var(--border-default)]">
            {TEST_SCORES.map((test) => (
              <div key={test.name} className="px-5 py-4 hover:bg-[var(--bg-secondary)] transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">{test.name}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      test.trend === "improving" ? "bg-green-50 text-green-700" : test.trend === "declining" ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-600"
                    }`}>
                      {test.trend}
                    </span>
                    <span className={`text-[14px] font-bold ${
                      test.score >= 95 ? "text-green-600" : test.score >= 80 ? "text-amber-600" : "text-red-600"
                    }`}>
                      {test.score}%
                    </span>
                  </div>
                </div>
                <div className="text-[12px] text-[var(--text-tertiary)] font-mono mb-2">{test.file}</div>
                <div className="flex items-center gap-4 text-[11px] text-[var(--text-tertiary)]">
                  <span>{test.runs} runs</span>
                  <span>{test.fails} failures</span>
                </div>
                <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${
                    test.score >= 95 ? "bg-green-400" : test.score >= 80 ? "bg-amber-400" : "bg-red-400"
                  }`} style={{ width: `${test.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "Fingerprint History" && (
        <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border-default)]">
            <span className="text-[13px] font-semibold">Fingerprint Intelligence Across Repos</span>
          </div>
          <div className="divide-y divide-[var(--border-default)]">
            {FINGERPRINT_HISTORY.map((fp) => (
              <div key={fp.hash} className="px-5 py-4 hover:bg-[var(--bg-secondary)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <code className="text-[12px] text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded">{fp.hash}</code>
                    <span className="text-[11px] text-[var(--text-tertiary)]">{fp.repos} repos</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    fp.warpfixHandled >= 80 ? "bg-green-50 text-green-700" : fp.warpfixHandled >= 50 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                  }`}>
                    {fp.warpfixHandled}% auto-resolved
                  </span>
                </div>
                <div className="text-[13px] text-[var(--text-primary)] font-mono mb-2">{fp.pattern}</div>
                <div className="grid grid-cols-4 gap-4 text-[11px] text-[var(--text-tertiary)]">
                  <span><TrendingUp className="w-3 h-3 inline mr-1" />{fp.totalMatches} matches</span>
                  <span><Clock className="w-3 h-3 inline mr-1" />Median fix: {fp.medianFixTime}</span>
                  <span>First: {fp.firstSeen}</span>
                  <span>Last: {fp.lastSeen}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "Owner Hotspots" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border-default)]">
              <span className="text-[13px] font-semibold">Top Failure-Prone Files (Last 30 Days)</span>
            </div>
            <div className="divide-y divide-[var(--border-default)]">
              {HOTSPOTS.map((spot) => (
                <div key={spot.file} className="px-5 py-4 hover:bg-[var(--bg-secondary)] transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-mono text-[var(--text-primary)]">{spot.file}</span>
                    <span className="text-[12px] font-semibold text-red-600">{spot.failures} failures</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{spot.owner}</span>
                    <span>{spot.pct}% of total</span>
                    <span>{spot.impactedDevs} devs impacted</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-red-400" style={{ width: `${spot.pct * 3}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border-default)]">
              <span className="text-[13px] font-semibold">Team Impact Summary</span>
            </div>
            <div className="divide-y divide-[var(--border-default)]">
              {TEAM_IMPACT.map((team) => (
                <div key={team.team} className="px-5 py-3 hover:bg-[var(--bg-secondary)] transition-colors flex items-center justify-between">
                  <div>
                    <span className="text-[13px] font-medium text-[var(--text-primary)]">{team.team}</span>
                    <div className="text-[11px] text-[var(--text-tertiary)]">{team.filesOwned} files owned</div>
                  </div>
                  <div className="flex items-center gap-6 text-[12px]">
                    <div className="text-center">
                      <div className="font-semibold text-red-600">{team.failures}</div>
                      <div className="text-[10px] text-[var(--text-tertiary)]">failures</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-amber-600">{team.ciMinutesWasted}m</div>
                      <div className="text-[10px] text-[var(--text-tertiary)]">CI wasted</div>
                    </div>
                  </div>
                </div>
              ))}
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
