"use client";

import { motion } from "framer-motion";
import { Eye, MessageSquare, GitPullRequest, Shield, ToggleLeft, ToggleRight } from "lucide-react";
import { useState } from "react";

const SAMPLE_REPAIRS = [
  {
    id: 1,
    error: "TypeError: Cannot read property 'length' of null",
    file: "src/utils/validator.ts:42",
    status: "comment-only",
    diff: `- const result = data.items.length;\n+ const result = data?.items?.length ?? 0;`,
    confidence: 91,
    time: "2m ago",
  },
  {
    id: 2,
    error: "Module not found: '@/lib/deprecated-helper'",
    file: "src/services/processor.ts:18",
    status: "comment-only",
    diff: `- import { formatDate } from '@/lib/deprecated-helper';\n+ import { formatDate } from '@/lib/utils';`,
    confidence: 87,
    time: "15m ago",
  },
  {
    id: 3,
    error: "Test timeout exceeded (5000ms)",
    file: "tests/integration/api.test.ts:156",
    status: "comment-only",
    diff: `- it('handles slow response', async () => {\n+ it('handles slow response', async () => {\n+   jest.setTimeout(15000);`,
    confidence: 73,
    time: "1h ago",
  },
];

export default function SimulationPage() {
  const [simEnabled, setSimEnabled] = useState(true);
  const [selectedRepair, setSelectedRepair] = useState<number | null>(null);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Simulation Mode</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Read-only mode — WarpFix analyzes failures and comments proposed patches without creating PRs or modifying code.
        </p>
      </div>

      {/* Mode toggle */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-[var(--border-default)] p-5 mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-indigo-600" />
            <div>
              <div className="text-[14px] font-semibold text-[var(--text-primary)]">Simulation Mode</div>
              <div className="text-[12px] text-[var(--text-tertiary)]">WarpFix will only comment with diffs — no PRs, no code changes</div>
            </div>
          </div>
          <button onClick={() => setSimEnabled(!simEnabled)} className="flex items-center gap-2">
            {simEnabled ? (
              <ToggleRight className="w-8 h-8 text-green-500" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-gray-400" />
            )}
            <span className={`text-[12px] font-medium ${simEnabled ? "text-green-600" : "text-gray-500"}`}>
              {simEnabled ? "Enabled" : "Disabled"}
            </span>
          </button>
        </div>
      </motion.div>

      {/* How it works */}
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        {[
          { icon: Eye, title: "Read-Only Access", desc: "WarpFix only reads logs and source files. No write access to your repository.", color: "text-blue-600" },
          { icon: MessageSquare, title: "Comment-Only Patches", desc: "Proposed fixes are posted as PR comments with full diff previews.", color: "text-indigo-600" },
          { icon: Shield, title: "Zero Risk", desc: "No branches created, no code modified. Perfect for security-sensitive orgs.", color: "text-green-600" },
        ].map((item) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-[var(--border-default)] p-4"
          >
            <item.icon className={`w-5 h-5 ${item.color} mb-2`} />
            <div className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">{item.title}</div>
            <div className="text-[12px] text-[var(--text-tertiary)]">{item.desc}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent simulation results */}
      <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border-default)] flex items-center justify-between">
          <span className="text-[13px] font-semibold">Recent Simulation Results</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Comment-Only</span>
            <span className="text-[11px] text-[var(--text-tertiary)]">{SAMPLE_REPAIRS.length} proposals</span>
          </div>
        </div>
        <div className="divide-y divide-[var(--border-default)]">
          {SAMPLE_REPAIRS.map((repair) => (
            <div key={repair.id}>
              <div
                className="px-5 py-4 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                onClick={() => setSelectedRepair(selectedRepair === repair.id ? null : repair.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">{repair.error}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--text-tertiary)]">{repair.time}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      repair.confidence >= 85 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {repair.confidence}%
                    </span>
                  </div>
                </div>
                <div className="text-[12px] text-[var(--text-tertiary)] font-mono">{repair.file}</div>
              </div>
              {selectedRepair === repair.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="px-5 pb-4"
                >
                  <div className="bg-[#1e1e2e] rounded-lg p-4 text-[12px] font-mono">
                    {repair.diff.split("\n").map((line, i) => (
                      <div key={i} className={line.startsWith("+") ? "text-green-400" : line.startsWith("-") ? "text-red-400" : "text-gray-400"}>
                        {line}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <GitPullRequest className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[11px] text-blue-600">This would be commented on the failing PR — no code changes made</span>
                  </div>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-center">
        <p className="text-[13px] text-[var(--text-secondary)]">
          Simulation mode is available on all plans. Upgrade to Pro to enable automatic PR creation.
        </p>
      </div>
    </div>
  );
}
