"use client";

import { motion } from "framer-motion";
import { BookOpen, Play, Pause, Settings, GitBranch, AlertTriangle, CheckCircle2, Clock, Zap, Terminal, Plus } from "lucide-react";
import { useState } from "react";

const PLAYBOOKS = [
  {
    id: "flaky-quarantine",
    name: "Flaky Test Quarantine",
    trigger: "on_test_failure",
    status: "active",
    runs: 47,
    lastRun: "2h ago",
    steps: [
      "Rerun failing test with diagnostics (--verbose --detectOpenHandles)",
      "If test passes on retry → mark as flaky, increment flake counter",
      "If flake rate > 15% → auto-open issue labeled 'flaky-test'",
      "Propose quarantine patch: move test to __flaky__/ directory",
      "Comment on PR with flaky test history and fix suggestion",
    ],
  },
  {
    id: "coverage-guard",
    name: "Coverage Regression Guard",
    trigger: "on_pr_opened",
    status: "active",
    runs: 89,
    lastRun: "30m ago",
    steps: [
      "Run coverage report on PR diff",
      "Identify uncovered changed lines",
      "Compare against base branch coverage",
      "If coverage drops > 2% → block PR with warning",
      "Comment with concrete test suggestions for uncovered paths",
    ],
  },
  {
    id: "dep-release",
    name: "Dependency Release Monitor",
    trigger: "on_schedule (daily)",
    status: "active",
    runs: 30,
    lastRun: "6h ago",
    steps: [
      "Scan lockfile for installed package versions",
      "Check npm/PyPI registry for new releases",
      "Flag breaking changes, deprecations, security advisories",
      "If critical security patch → auto-open version bump PR",
      "Update dependency dashboard with new findings",
    ],
  },
  {
    id: "fingerprint-alert",
    name: "New Fingerprint Alert",
    trigger: "on_new_fingerprint",
    status: "active",
    runs: 12,
    lastRun: "1d ago",
    steps: [
      "New error fingerprint detected — no prior matches",
      "Search org repos for similar patterns",
      "Classify error type and estimate complexity",
      "Open tech-debt ticket if pattern appears systemic",
      "Alert team channel with fingerprint details",
    ],
  },
  {
    id: "release-gate",
    name: "Release Readiness Gate",
    trigger: "on_branch (release/*)",
    status: "paused",
    runs: 5,
    lastRun: "1w ago",
    steps: [
      "Run full test suite including E2E",
      "Check all flaky tests are quarantined",
      "Verify no critical dependency alerts",
      "Generate release notes from merged PRs",
      "Post readiness report to release channel",
    ],
  },
];

const AGENT_EVENTS = [
  { time: "2h ago", agent: "Flaky Test Quarantine", event: "Detected flaky test: should render dashboard with user data (23% flake rate)", status: "completed" },
  { time: "30m ago", agent: "Coverage Regression Guard", event: "PR #847: coverage dropped by 3.2% — blocked with test suggestions", status: "completed" },
  { time: "6h ago", agent: "Dependency Release Monitor", event: "lodash 4.17.21 available — CVE-2021-23337 fix. Auto-PR opened.", status: "completed" },
  { time: "1d ago", agent: "New Fingerprint Alert", event: "New fingerprint f2a9d7e5 detected in 2 repos — Docker OOM pattern", status: "completed" },
];

export default function RunbookPage() {
  const [expandedPlaybook, setExpandedPlaybook] = useState<string | null>("flaky-quarantine");
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">CI Runbook Agent</h1>
            <p className="text-[13px] text-[var(--text-tertiary)]">
              Composable CI playbooks triggered by events. Define automation recipes in .warpfix.yaml — WarpFix executes them as background agents.
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--brand)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-hover)] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Playbook
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Active Playbooks", value: "4", icon: BookOpen, color: "text-indigo-600" },
          { label: "Total Runs", value: "183", icon: Play, color: "text-green-600" },
          { label: "Events Processed", value: "1,247", icon: Zap, color: "text-amber-600" },
          { label: "Issues Prevented", value: "42", icon: CheckCircle2, color: "text-blue-600" },
        ].map((card) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-[var(--border-default)] p-4">
            <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
            <div className="text-xl font-bold text-[var(--text-primary)]">{card.value}</div>
            <div className="text-[12px] text-[var(--text-tertiary)]">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Create form */}
      {showCreateForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-[var(--border-default)] p-5 mb-6">
          <h3 className="text-[14px] font-semibold text-[var(--text-primary)] mb-3">Create New Playbook</h3>
          <div className="bg-[#1e1e2e] rounded-lg p-4 font-mono text-[12px] text-green-400">
            <pre>{`# Add to your .warpfix.yaml
playbooks:
  - name: "My Custom Playbook"
    trigger: on_ci_failure  # or on_pr_opened, on_schedule, on_new_fingerprint
    conditions:
      branch: "main"
      error_type: "test_failure"
    steps:
      - run: "npm test -- --verbose"
      - analyze: "failure_logs"
      - notify:
          channel: "#ci-alerts"
          template: "failure_report"
      - fix:
          mode: "comment"  # or "pr" or "auto"
          confidence_threshold: 0.8`}</pre>
          </div>
          <p className="mt-3 text-[12px] text-[var(--text-tertiary)]">
            Define playbooks in your .warpfix.yaml file. WarpFix picks them up automatically on next CI event.
          </p>
        </motion.div>
      )}

      {/* Playbooks list */}
      <div className="space-y-3 mb-6">
        {PLAYBOOKS.map((playbook) => (
          <motion.div
            key={playbook.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden"
          >
            <div
              className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
              onClick={() => setExpandedPlaybook(expandedPlaybook === playbook.id ? null : playbook.id)}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <div>
                  <div className="text-[14px] font-semibold text-[var(--text-primary)]">{playbook.name}</div>
                  <div className="flex items-center gap-3 text-[11px] text-[var(--text-tertiary)] mt-0.5">
                    <span className="font-mono">{playbook.trigger}</span>
                    <span>{playbook.runs} runs</span>
                    <span>Last: {playbook.lastRun}</span>
                  </div>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                playbook.status === "active" ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-500 border border-gray-200"
              }`}>
                {playbook.status}
              </span>
            </div>
            {expandedPlaybook === playbook.id && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pb-5 border-t border-[var(--border-default)] pt-4">
                <div className="text-[12px] font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-2">Steps</div>
                <div className="space-y-2">
                  {playbook.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-[12px] text-[var(--text-secondary)]">{step}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Recent agent activity */}
      <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-[var(--border-default)]">
          <span className="text-[13px] font-semibold">Recent Agent Activity</span>
        </div>
        <div className="divide-y divide-[var(--border-default)]">
          {AGENT_EVENTS.map((event, i) => (
            <div key={i} className="px-5 py-3 hover:bg-[var(--bg-secondary)] transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">{event.agent}</span>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-[11px] text-[var(--text-tertiary)]">{event.time}</span>
                </div>
              </div>
              <div className="text-[12px] text-[var(--text-secondary)]">{event.event}</div>
            </div>
          ))}
        </div>
      </div>

      {/* WarpFix Doctor */}
      <div className="bg-white rounded-xl border border-[var(--border-default)] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-5 h-5 text-indigo-600" />
          <span className="text-[14px] font-semibold text-[var(--text-primary)]">WarpFix Doctor</span>
        </div>
        <p className="text-[12px] text-[var(--text-tertiary)] mb-3">
          A terminal agent that queries logs, PRs, and failures, then suggests commands or patches. Works inside Warp terminal.
        </p>
        <div className="bg-[#1e1e2e] rounded-lg p-4 font-mono text-[12px]">
          <div className="text-green-400">$ warpfix doctor</div>
          <div className="text-gray-400 mt-2">Scanning CI history for repo: my-app...</div>
          <div className="text-gray-400 mt-1">Analyzing 340 workflow runs from last 30 days...</div>
          <div className="text-white mt-3">CI Health Report:</div>
          <div className="text-red-400 mt-1">  3 failures in last 24h</div>
          <div className="text-gray-400">    ├─ TypeError in src/api/handler.ts (fingerprint: a3f8c2d1)</div>
          <div className="text-gray-400">    ├─ ESLint import/order in src/utils.ts (auto-fixable)</div>
          <div className="text-gray-400">    └─ Test timeout in tests/integration.test.ts (flaky: 18%)</div>
          <div className="text-amber-400 mt-2">  2 flaky tests detected (quarantine recommended)</div>
          <div className="text-blue-400 mt-1">  1 outdated dependency with security advisory</div>
          <div className="text-green-400 mt-3">Run `warpfix fix --dry-run` to preview patches</div>
          <div className="text-green-400">Run `warpfix quarantine --apply` to isolate flaky tests</div>
        </div>
      </div>
    </div>
  );
}
