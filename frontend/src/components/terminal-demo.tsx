"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const LINES = [
  { text: "$ /fix-ci", type: "command" as const, delay: 0 },
  { text: "Detecting latest CI failure...", type: "info" as const, delay: 800 },
  { text: "Found: workflow_run #4821 failed on main", type: "info" as const, delay: 1500 },
  { text: "Parsing build logs...", type: "info" as const, delay: 2200 },
  { text: 'Error: Cannot find module "@/lib/auth"', type: "error" as const, delay: 2800 },
  { text: "Classification: dependency_error (confidence: 0.92)", type: "info" as const, delay: 3500 },
  { text: "Fingerprint: a3f8c2d1 (matched 12 times)", type: "success" as const, delay: 4200 },
  { text: "Reusing cached patch...", type: "info" as const, delay: 4800 },
  { text: "Sandbox: all checks passed", type: "success" as const, delay: 5600 },
  { text: "Confidence: 94/100 (auto_merge recommended)", type: "success" as const, delay: 6400 },
  { text: "PR #287 opened → github.com/org/repo/pull/287", type: "success" as const, delay: 7200 },
];

const typeColors = {
  command: "text-white font-semibold",
  info: "text-gray-400",
  error: "text-red-400",
  success: "text-emerald-400",
};

export function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timers = LINES.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="rounded-xl overflow-hidden ring-1 ring-black/10 max-w-2xl mx-auto">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#1e1e2e] border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="ml-2 text-xs text-gray-500 font-mono">warp ~/project</span>
      </div>
      {/* Terminal content */}
      <div className="bg-[#0f0f1a] p-5 font-mono text-[13px] leading-6 min-h-[300px]">
        {LINES.slice(0, visibleLines).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className={typeColors[line.type]}
          >
            {line.text}
          </motion.div>
        ))}
        {visibleLines < LINES.length && (
          <motion.span
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="inline-block w-2 h-4 bg-[var(--brand)] mt-1"
          />
        )}
      </div>
    </div>
  );
}
