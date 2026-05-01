"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  Brain, BookOpen, FileCode2, Download, Upload, Plus, Check,
  X, Pencil, GitBranch, Users, Settings, Lightbulb,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

const MEMORY_STATS = [
  { label: "Learned Preferences", value: "47", icon: Brain, color: "text-indigo-600" },
  { label: "PR Feedback Signals", value: "312", icon: GitBranch, color: "text-blue-600" },
  { label: "Team Members Contributing", value: "8", icon: Users, color: "text-emerald-600" },
  { label: "Accuracy Improvement", value: "+34%", icon: Lightbulb, color: "text-amber-600" },
];

const ORG_PREFERENCES = [
  {
    id: "pref_1", category: "Package Manager",
    rule: "Always prefer pnpm over npm for dependency fixes",
    source: "Learned from 12 PR edits", confidence: 98, lastUsed: "2 hours ago",
    examples: ["pnpm install instead of npm install", "pnpm add instead of npm install --save"],
  },
  {
    id: "pref_2", category: "Linting",
    rule: "Use --fix for ESLint errors, never --disable-next-line",
    source: "Learned from 8 PR rejections", confidence: 95, lastUsed: "4 hours ago",
    examples: ["eslint --fix src/", "Apply auto-fixable rules directly"],
  },
  {
    id: "pref_3", category: "Testing",
    rule: "Jest tests use describe/it pattern with explicit assertions",
    source: "Inferred from .eslintrc + 5 PR edits", confidence: 89, lastUsed: "1 day ago",
    examples: ["describe('Component', () => { it('should ...', () => { expect(...) }) })"],
  },
  {
    id: "pref_4", category: "Docker",
    rule: "Dockerfile base image updates require manual sign-off (never auto-merge)",
    source: "Learned from 3 PR rejections", confidence: 100, lastUsed: "3 days ago",
    examples: ["Flag as 'review-required' when FROM line changes"],
  },
  {
    id: "pref_5", category: "TypeScript",
    rule: "Prefer explicit return types on exported functions",
    source: "Inferred from tsconfig strict mode + 4 PR edits", confidence: 82, lastUsed: "6 hours ago",
    examples: ["export function getName(): string { ... }"],
  },
  {
    id: "pref_6", category: "CI Config",
    rule: "GitHub Actions should use pinned action versions (not @latest)",
    source: "Learned from 2 PR edits", confidence: 91, lastUsed: "2 days ago",
    examples: ["uses: actions/checkout@v4", "uses: actions/setup-node@v4"],
  },
  {
    id: "pref_7", category: "Flaky Tests",
    rule: "Tests in src/components/__tests__/DatePicker.test.tsx are known flaky — skip quarantine",
    source: "Team annotation", confidence: 100, lastUsed: "1 day ago",
    examples: ["Auto-retry up to 3 times before reporting failure"],
  },
];

const IMPORTED_CONFIGS = [
  { name: ".eslintrc.json", type: "ESLint", rules: 42, status: "imported" },
  { name: ".prettierrc", type: "Prettier", rules: 8, status: "imported" },
  { name: "tsconfig.json", type: "TypeScript", rules: 15, status: "imported" },
  { name: ".nvmrc", type: "Node Version", rules: 1, status: "imported" },
  { name: "renovate.json", type: "Renovate", rules: 6, status: "available" },
  { name: ".github/dependabot.yml", type: "Dependabot", rules: 3, status: "available" },
];

const FEEDBACK_LOG = [
  { action: "PR modified", pr: "#287", detail: "Changed npm install → pnpm install", date: "2 hours ago", user: "alexchen" },
  { action: "PR rejected", pr: "#284", detail: "Dockerfile base image change needs review", date: "1 day ago", user: "sarahdev" },
  { action: "PR merged as-is", pr: "#281", detail: "ESLint fix applied correctly", date: "1 day ago", user: "alexchen" },
  { action: "PR modified", pr: "#279", detail: "Added explicit return type to export", date: "2 days ago", user: "mikejr" },
  { action: "PR rejected", pr: "#276", detail: "Used eslint-disable instead of --fix", date: "3 days ago", user: "sarahdev" },
];

export default function OrgMemoryPage() {
  const [activeTab, setActiveTab] = useState<"preferences" | "imports" | "feedback">("preferences");
  const [expandedPref, setExpandedPref] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
        <motion.div variants={fadeUp} custom={0} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Brain className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Org CI Memory</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                WarpFix learns how your team works — accumulated preferences from PR feedback
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border-default)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
              <Download className="w-3.5 h-3.5" />
              Export .warpfix-memory.yaml
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border-default)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Import
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {MEMORY_STATS.map((s, i) => (
          <motion.div key={s.label} initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} custom={i}
            className="p-4 rounded-xl border border-[var(--border-default)] bg-white">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-[var(--text-secondary)]">{s.label}</span>
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Switching cost info */}
      <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-indigo-900">Your Team&apos;s CI Intelligence</p>
            <p className="text-xs text-indigo-700 mt-1">
              WarpFix has learned <strong>47 org-specific preferences</strong> from your team&apos;s PR feedback.
              Every time a developer modifies, rejects, or approves a WarpFix PR, the system captures that signal
              and uses it to improve future fixes. This accumulated memory is unique to your organization —
              a competitor starting fresh would have none of it.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-default)]">
        {[
          { id: "preferences" as const, label: "Learned Preferences" },
          { id: "imports" as const, label: "Config Imports" },
          { id: "feedback" as const, label: "Feedback Log" },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Preferences */}
      {activeTab === "preferences" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Org Preferences</h2>
            <button onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Add Preference
            </button>
          </div>

          {showAddForm && (
            <div className="p-4 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Category</label>
                  <input type="text" placeholder="e.g., Testing, Linting, Docker..."
                    className="w-full mt-1 px-3 py-2 text-sm border border-[var(--border-default)] rounded-lg" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)]">Rule</label>
                  <input type="text" placeholder="Always prefer X over Y for..."
                    className="w-full mt-1 px-3 py-2 text-sm border border-[var(--border-default)] rounded-lg" />
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg">
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                  <button onClick={() => setShowAddForm(false)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs border border-[var(--border-default)] rounded-lg">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {ORG_PREFERENCES.map((pref) => (
            <div key={pref.id}
              className="rounded-xl border border-[var(--border-default)] bg-white overflow-hidden">
              <button
                onClick={() => setExpandedPref(expandedPref === pref.id ? null : pref.id)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-medium">
                      {pref.category}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      pref.confidence >= 95 ? "bg-emerald-100 text-emerald-700" :
                      pref.confidence >= 80 ? "bg-blue-100 text-blue-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>{pref.confidence}% confidence</span>
                  </div>
                  <p className="text-sm font-medium">{pref.rule}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">{pref.source} · Last used {pref.lastUsed}</p>
                </div>
                <Pencil className="w-4 h-4 text-[var(--text-secondary)] ml-2" />
              </button>
              {expandedPref === pref.id && (
                <div className="p-4 border-t border-[var(--border-default)] bg-[var(--bg-secondary)]">
                  <div className="text-xs font-medium text-[var(--text-secondary)] mb-2">Examples</div>
                  <div className="space-y-1">
                    {pref.examples.map((ex, i) => (
                      <code key={i} className="block text-xs bg-white p-2 rounded border border-[var(--border-default)] font-mono">
                        {ex}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: Config Imports */}
      {activeTab === "imports" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-indigo-600" />
            Imported Configurations
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            WarpFix imports your existing config files to personalize fixes from day one.
          </p>
          <div className="space-y-2">
            {IMPORTED_CONFIGS.map((cfg) => (
              <div key={cfg.name}
                className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-default)] bg-white">
                <div className="flex items-center gap-3">
                  <FileCode2 className="w-4 h-4 text-[var(--text-secondary)]" />
                  <div>
                    <p className="text-sm font-mono font-medium">{cfg.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{cfg.type} · {cfg.rules} rules</p>
                  </div>
                </div>
                {cfg.status === "imported" ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                    <Check className="w-3 h-3" /> Imported
                  </span>
                ) : (
                  <button className="text-xs text-indigo-600 hover:text-indigo-700 px-2 py-1 border border-indigo-200 rounded">
                    Import
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-[var(--border-default)] bg-gray-50">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Memory Export Format
            </h3>
            <pre className="text-xs font-mono bg-white p-3 rounded border border-[var(--border-default)] overflow-x-auto">{`# .warpfix-memory.yaml
# Org-level CI memory — check into your repo
org_preferences:
  package_manager: pnpm
  linting_strategy: autofix_only
  docker_base_image_policy: require_review
  test_pattern: describe_it
  
known_flaky_tests:
  - path: src/components/__tests__/DatePicker.test.tsx
    strategy: retry_3x

imported_configs:
  - .eslintrc.json
  - .prettierrc
  - tsconfig.json`}</pre>
          </div>
        </div>
      )}

      {/* Tab: Feedback Log */}
      {activeTab === "feedback" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-indigo-600" />
            PR Feedback Signals
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Every PR interaction teaches WarpFix your team&apos;s preferences.
          </p>
          <div className="rounded-xl border border-[var(--border-default)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-secondary)]">
                  <th className="text-left p-3 font-medium">Action</th>
                  <th className="text-left p-3 font-medium">PR</th>
                  <th className="text-left p-3 font-medium">Detail</th>
                  <th className="text-left p-3 font-medium">By</th>
                  <th className="text-right p-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {FEEDBACK_LOG.map((log, i) => (
                  <tr key={i} className="border-t border-[var(--border-default)]">
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        log.action === "PR rejected" ? "bg-red-100 text-red-700" :
                        log.action === "PR modified" ? "bg-amber-100 text-amber-700" :
                        "bg-emerald-100 text-emerald-700"
                      }`}>{log.action}</span>
                    </td>
                    <td className="p-3 font-mono text-xs">{log.pr}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{log.detail}</td>
                    <td className="p-3 font-medium">{log.user}</td>
                    <td className="p-3 text-right text-[var(--text-secondary)]">{log.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
