"use client";

import { useState, useEffect } from "react";

const LINES = [
  { text: "$ /fix-ci", type: "command" as const, delay: 0 },
  { text: "Detecting latest CI failure...", type: "info" as const, delay: 800 },
  { text: 'Found: workflow_run #4821 failed on main', type: "info" as const, delay: 1500 },
  { text: "Parsing build logs...", type: "info" as const, delay: 2200 },
  { text: 'Error: Cannot find module "@/lib/auth"', type: "error" as const, delay: 2800 },
  { text: "Classification: dependency_error (confidence: 0.92)", type: "info" as const, delay: 3500 },
  { text: "Fingerprint: a3f8c2d1 (matched 12 times)", type: "success" as const, delay: 4200 },
  { text: "Reusing cached patch...", type: "info" as const, delay: 4800 },
  { text: "Validating in sandbox...", type: "info" as const, delay: 5400 },
  { text: "Sandbox: all checks passed", type: "success" as const, delay: 6200 },
  { text: "Confidence: 94/100 (auto_merge recommended)", type: "success" as const, delay: 6800 },
  { text: "PR #287 opened: https://github.com/org/repo/pull/287", type: "success" as const, delay: 7500 },
];

export function TerminalDemo() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const timers = LINES.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="bg-[#0d1117] border border-border rounded-xl overflow-hidden shadow-2xl max-w-2xl mx-auto text-left">
      <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] border-b border-border">
        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-xs text-muted-foreground font-mono">warp ~/project</span>
      </div>
      <div className="p-4 font-mono text-sm space-y-1 min-h-[320px]">
        {LINES.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            className={
              line.type === "command"
                ? "text-foreground font-bold"
                : line.type === "error"
                ? "text-danger"
                : line.type === "success"
                ? "text-success"
                : "text-muted-foreground"
            }
          >
            {line.text}
          </div>
        ))}
        {visibleLines < LINES.length && (
          <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
        )}
      </div>
    </div>
  );
}
