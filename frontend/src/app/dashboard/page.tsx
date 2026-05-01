"use client";

import { StatsCards } from "@/components/stats-cards";
import { RecentRepairs } from "@/components/recent-repairs";
import { motion } from "framer-motion";
import { Zap, ArrowRight, Terminal, MessageSquare, Copy, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const CLI_COMMANDS = [
  { cmd: "fix-ci", desc: "Auto-repair a failing CI workflow" },
  { cmd: "fix-tests", desc: "Fix broken test cases" },
  { cmd: "fix-deps", desc: "Resolve dependency conflicts" },
  { cmd: "fix-runtime", desc: "Fix runtime errors" },
  { cmd: "repair-last", desc: "Show the last repair result" },
  { cmd: "predict-failure", desc: "Predict potential CI failures" },
];

const PR_COMMANDS = [
  { cmd: "@warpfix explain", desc: "Explain why a change was made" },
  { cmd: "@warpfix fix", desc: "Generate a fix for an issue" },
  { cmd: "@warpfix test", desc: "Generate test cases for code" },
  { cmd: "@warpfix refactor", desc: "Suggest refactoring improvements" },
  { cmd: "@warpfix security", desc: "Run a security analysis" },
  { cmd: "@warpfix performance", desc: "Analyze performance implications" },
  { cmd: "@warpfix help", desc: "Show all available commands" },
];

export default function DashboardPage() {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">Dashboard</h1>
        <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
          Overview of your repair activity and CI health
        </p>
      </motion.div>

      <StatsCards />

      {/* Upgrade Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100 p-5 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--brand-muted)] flex items-center justify-center">
            <Zap className="w-5 h-5 text-[var(--brand)]" />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-[var(--text-primary)]">
              Unlock unlimited repairs
            </div>
            <div className="text-[12px] text-[var(--text-secondary)]">
              Upgrade to Pro for unlimited repairs, sandbox validation, and priority support.
            </div>
          </div>
        </div>
        <Link
          href="/dashboard/billing"
          className="flex items-center gap-1.5 px-4 py-2 bg-[var(--brand)] text-white text-[13px] font-medium rounded-lg hover:bg-[var(--brand-hover)] transition-colors shrink-0"
        >
          Upgrade
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </motion.div>

      {/* WarpFix Commands Guide */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-8"
      >
        <h2 className="text-[15px] font-semibold mb-4">WarpFix Commands</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* CLI Commands */}
          <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--border-default)] flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[var(--brand)]" />
              <span className="text-[13px] font-semibold">Terminal / CLI</span>
              <span className="ml-auto text-[11px] text-[var(--text-tertiary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full font-mono">
                warpfix &lt;command&gt;
              </span>
            </div>
            <div className="divide-y divide-[var(--border-default)]">
              {CLI_COMMANDS.map((item) => (
                <div key={item.cmd} className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--bg-secondary)] transition-colors group">
                  <code className="text-[12px] font-mono text-[var(--brand)] bg-[var(--brand-muted)] px-2 py-0.5 rounded font-medium shrink-0">
                    {item.cmd}
                  </code>
                  <span className="text-[12px] text-[var(--text-secondary)] flex-1">{item.desc}</span>
                  <button
                    onClick={() => handleCopy(`warpfix ${item.cmd}`)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--bg-tertiary)]"
                    title="Copy command"
                  >
                    {copiedCmd === `warpfix ${item.cmd}` ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3 text-[var(--text-tertiary)]" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* PR Comment Commands */}
          <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--border-default)] flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[var(--brand)]" />
              <span className="text-[13px] font-semibold">PR Comments</span>
              <span className="ml-auto text-[11px] text-[var(--text-tertiary)] bg-[var(--bg-secondary)] px-2 py-0.5 rounded-full font-mono">
                @warpfix &lt;command&gt;
              </span>
            </div>
            <div className="divide-y divide-[var(--border-default)]">
              {PR_COMMANDS.map((item) => (
                <div key={item.cmd} className="px-5 py-3 flex items-center gap-3 hover:bg-[var(--bg-secondary)] transition-colors group">
                  <code className="text-[12px] font-mono text-[var(--brand)] bg-[var(--brand-muted)] px-2 py-0.5 rounded font-medium shrink-0">
                    {item.cmd}
                  </code>
                  <span className="text-[12px] text-[var(--text-secondary)] flex-1">{item.desc}</span>
                  <button
                    onClick={() => handleCopy(item.cmd)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-[var(--bg-tertiary)]"
                    title="Copy command"
                  >
                    {copiedCmd === item.cmd ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3 text-[var(--text-tertiary)]" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Auto-triggers info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-default)] px-5 py-4"
        >
          <div className="text-[13px] font-semibold text-[var(--text-primary)] mb-2">Automatic Triggers</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px] text-[var(--text-secondary)]">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span><strong>CI Failure</strong> — WarpFix auto-detects failed workflows and generates a repair PR</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <span><strong>PR Review</strong> — Automatic code review on every new PR or push</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
              <span><strong>Chat</strong> — Mention <code className="text-[11px] font-mono bg-[var(--bg-tertiary)] px-1 rounded">@warpfix</code> in any PR comment for interactive help</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="mt-8">
        <h2 className="text-[15px] font-semibold mb-4">Recent Repairs</h2>
        <RecentRepairs />
      </div>
    </div>
  );
}
