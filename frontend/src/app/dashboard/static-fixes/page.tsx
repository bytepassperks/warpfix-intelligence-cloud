"use client";

import { motion } from "framer-motion";
import { Wrench, CheckCircle2, Clock, FileCode, Zap } from "lucide-react";
import { useState } from "react";

const TOOLS = [
  {
    name: "ESLint",
    icon: "📐",
    desc: "JavaScript/TypeScript linting and auto-fix",
    fixes: 142,
    lastRun: "1h ago",
    status: "active",
    rules: ["no-unused-vars", "import/order", "prefer-const", "no-console", "semi"],
  },
  {
    name: "Prettier",
    icon: "🎨",
    desc: "Code formatting — consistent style across all files",
    fixes: 89,
    lastRun: "1h ago",
    status: "active",
    rules: ["printWidth: 100", "singleQuote: true", "trailingComma: all", "tabWidth: 2"],
  },
  {
    name: "Ruff",
    icon: "🐍",
    desc: "Python linting and formatting (replaces flake8, isort, black)",
    fixes: 67,
    lastRun: "3h ago",
    status: "active",
    rules: ["E501 line-too-long", "F401 unused-import", "I001 import-sort", "W291 trailing-whitespace"],
  },
  {
    name: "rustfmt",
    icon: "🦀",
    desc: "Rust code formatting with cargo fmt",
    fixes: 23,
    lastRun: "1d ago",
    status: "active",
    rules: ["edition = 2021", "max_width = 100", "use_field_init_shorthand = true"],
  },
  {
    name: "gofmt",
    icon: "🐹",
    desc: "Go code formatting — standard Go style",
    fixes: 18,
    lastRun: "2d ago",
    status: "active",
    rules: ["tab indentation", "aligned declarations", "simplified slices"],
  },
];

const RECENT_FIXES = [
  { tool: "ESLint", file: "src/components/Header.tsx", rule: "no-unused-vars", fix: "Removed unused import 'React'", time: "12m ago" },
  { tool: "Prettier", file: "src/utils/format.ts", rule: "trailingComma", fix: "Added trailing comma to function params", time: "12m ago" },
  { tool: "ESLint", file: "src/hooks/useAuth.ts", rule: "prefer-const", fix: "Changed let → const for 3 variables", time: "1h ago" },
  { tool: "Ruff", file: "scripts/deploy.py", rule: "F401", fix: "Removed unused import: os.path", time: "3h ago" },
  { tool: "Prettier", file: "src/pages/Dashboard.tsx", rule: "printWidth", fix: "Reformatted 4 lines exceeding 100 chars", time: "3h ago" },
  { tool: "ESLint", file: "src/api/routes.ts", rule: "import/order", fix: "Reordered imports: externals → internals", time: "5h ago" },
];

export default function StaticFixesPage() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Static Tool Auto-Fixes</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Deterministic fixes via ruff, eslint, prettier — zero LLM cost, runs in sandbox. Formatting and trivial lint issues are fixed automatically.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Auto-Fixes", value: "339", icon: Wrench, color: "text-indigo-600" },
          { label: "LLM Tokens Saved", value: "~2.4M", icon: Zap, color: "text-amber-600" },
          { label: "Avg Fix Time", value: "0.8s", icon: Clock, color: "text-blue-600" },
          { label: "Success Rate", value: "100%", icon: CheckCircle2, color: "text-green-600" },
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

      {/* Tools grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {TOOLS.map((tool) => (
          <motion.div
            key={tool.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
              selectedTool === tool.name ? "border-indigo-300 shadow-sm" : "border-[var(--border-default)] hover:border-indigo-200"
            }`}
            onClick={() => setSelectedTool(selectedTool === tool.name ? null : tool.name)}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{tool.icon}</span>
              <span className="text-[14px] font-semibold text-[var(--text-primary)]">{tool.name}</span>
              <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">Active</span>
            </div>
            <p className="text-[12px] text-[var(--text-tertiary)] mb-3">{tool.desc}</p>
            <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
              <span>{tool.fixes} fixes applied</span>
              <span>Last: {tool.lastRun}</span>
            </div>
            {selectedTool === tool.name && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 pt-3 border-t border-[var(--border-default)]">
                <div className="text-[11px] font-semibold text-[var(--text-primary)] mb-1.5">Active Rules</div>
                <div className="flex flex-wrap gap-1">
                  {tool.rules.map((rule) => (
                    <span key={rule} className="text-[10px] px-2 py-0.5 bg-[var(--bg-secondary)] rounded-full text-[var(--text-secondary)] font-mono">
                      {rule}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Recent fixes */}
      <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border-default)]">
          <span className="text-[13px] font-semibold">Recent Auto-Fixes</span>
        </div>
        <div className="divide-y divide-[var(--border-default)]">
          {RECENT_FIXES.map((fix, i) => (
            <div key={i} className="px-5 py-3 hover:bg-[var(--bg-secondary)] transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">{fix.tool}</span>
                  <span className="text-[12px] font-mono text-[var(--text-secondary)]">{fix.file}</span>
                </div>
                <span className="text-[11px] text-[var(--text-tertiary)]">{fix.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--text-tertiary)] font-mono">{fix.rule}</span>
                <span className="text-[11px] text-[var(--text-secondary)]">— {fix.fix}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
