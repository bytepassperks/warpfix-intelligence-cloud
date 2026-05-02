"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Brain, BookOpen, FileCode2, Download, Upload, Plus, Check,
  X, Pencil, GitBranch, Users, Settings, Lightbulb, Loader2,
} from "lucide-react";
import { UpgradeGate } from "@/components/ui/upgrade-gate";
import { API_URL } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

interface OrgMemoryData {
  overview: {
    totalPreferences: number;
    totalApplications: number;
    avgConfidence: number;
    categories: number;
    feedbackSignals: number;
  };
  preferences: {
    id: string;
    category: string;
    rule: string;
    confidence: number;
    source: string;
    times_applied: number;
    last_used_at: string;
    created_at: string;
  }[];
  categories: {
    category: string;
    rules_count: string;
    avg_confidence: string;
    total_applications: string;
  }[];
  feedbackLog: {
    id: string;
    rule: string;
    category: string;
    context: string;
    source: string;
    times_applied: number;
    created_at: string;
  }[];
}

const IMPORTED_CONFIGS = [
  { name: ".eslintrc.json", type: "ESLint", rules: 42, status: "imported" },
  { name: ".prettierrc", type: "Prettier", rules: 8, status: "imported" },
  { name: "tsconfig.json", type: "TypeScript", rules: 15, status: "imported" },
  { name: ".nvmrc", type: "Node Version", rules: 1, status: "imported" },
  { name: "renovate.json", type: "Renovate", rules: 6, status: "available" },
  { name: ".github/dependabot.yml", type: "Dependabot", rules: 3, status: "available" },
];

export default function OrgMemoryPage() {
  const [activeTab, setActiveTab] = useState<"preferences" | "imports" | "feedback">("preferences");
  const [expandedPref, setExpandedPref] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [data, setData] = useState<OrgMemoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gated, setGated] = useState<{feature: string; currentPlan: string; requiredPlan: string} | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_URL}/api/intelligence/org-memory`, { credentials: "include" });
        if (res.status === 403) { const b = await res.json(); if (b.feature) { setGated({ feature: b.feature, currentPlan: b.current_plan || "free", requiredPlan: b.required_plan || "pro" }); setLoading(false); return; } }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (gated) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <UpgradeGate feature={gated.feature} requiredPlan={gated.requiredPlan} currentPlan={gated.currentPlan} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          Failed to load Org Memory data: {error || "No data available"}
        </div>
      </div>
    );
  }

  const { overview, preferences, categories, feedbackLog } = data;

  const statsCards = [
    { label: "Learned Preferences", value: overview.totalPreferences.toLocaleString(), icon: Brain, color: "text-indigo-600" },
    { label: "PR Feedback Signals", value: overview.feedbackSignals.toLocaleString(), icon: GitBranch, color: "text-blue-600" },
    { label: "Categories", value: overview.categories.toLocaleString(), icon: Users, color: "text-emerald-600" },
    { label: "Avg Confidence", value: `${overview.avgConfidence}%`, icon: Lightbulb, color: "text-amber-600" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
        <motion.div variants={fadeUp} custom={0} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
              <Brain className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Org CI Memory</h1>
              <p className="text-sm text-[var(--text-secondary)]">
                WarpFix learns how your team works — accumulated preferences from PR feedback
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border-default)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors whitespace-nowrap">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--border-default)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors whitespace-nowrap">
              <Upload className="w-3.5 h-3.5" />
              Import
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((s, i) => (
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
              WarpFix has learned <strong>{overview.totalPreferences} org-specific preferences</strong> from your team&apos;s PR feedback,
              applied <strong>{overview.totalApplications} times</strong> with {overview.avgConfidence}% average confidence.
              Every time a developer modifies, rejects, or approves a WarpFix PR, the system captures that signal
              and uses it to improve future fixes. This accumulated memory is unique to your organization.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-default)] overflow-x-auto">
        {[
          { id: "preferences" as const, label: "Learned Preferences" },
          { id: "imports" as const, label: "Config Imports" },
          { id: "feedback" as const, label: "Feedback Log" },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
            <h2 className="text-lg font-semibold">Org Preferences ({preferences.length})</h2>
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

          {preferences.map((pref) => (
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
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Source: {pref.source} &middot; Applied {pref.times_applied} times &middot; Last used {new Date(pref.last_used_at).toLocaleDateString()}
                  </p>
                </div>
                <Pencil className="w-4 h-4 text-[var(--text-secondary)] ml-2" />
              </button>
              {expandedPref === pref.id && (
                <div className="p-4 border-t border-[var(--border-default)] bg-[var(--bg-secondary)]">
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-[var(--text-secondary)]">Source</span>
                      <div className="font-semibold mt-1">{pref.source}</div>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)]">Times Applied</span>
                      <div className="font-semibold mt-1">{pref.times_applied}</div>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)]">Created</span>
                      <div className="font-semibold mt-1">{new Date(pref.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {preferences.length === 0 && (
            <div className="py-8 text-center text-sm text-[var(--text-tertiary)]">
              No preferences learned yet. Preferences are captured from PR feedback over time.
            </div>
          )}
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
                    <p className="text-xs text-[var(--text-secondary)]">{cfg.type} &middot; {cfg.rules} rules</p>
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

          {feedbackLog.length > 0 ? (
            <div className="rounded-xl border border-[var(--border-default)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-secondary)]">
                    <th className="text-left p-3 font-medium">Category</th>
                    <th className="text-left p-3 font-medium">Rule</th>
                    <th className="text-left p-3 font-medium">Source</th>
                    <th className="text-right p-3 font-medium">Applied</th>
                    <th className="text-right p-3 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbackLog.map((log) => (
                    <tr key={log.id} className="border-t border-[var(--border-default)]">
                      <td className="p-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-medium">
                          {log.category}
                        </span>
                      </td>
                      <td className="p-3 text-[var(--text-secondary)] max-w-xs truncate">{log.rule}</td>
                      <td className="p-3 text-xs">{log.source}</td>
                      <td className="p-3 text-right font-medium">{log.times_applied}x</td>
                      <td className="p-3 text-right text-[var(--text-secondary)]">{new Date(log.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-[var(--text-tertiary)]">
              No feedback signals yet. These appear as your team interacts with WarpFix PRs.
            </div>
          )}

          {/* Category breakdown */}
          {categories.length > 0 && (
            <div className="rounded-xl border border-[var(--border-default)] overflow-hidden">
              <div className="px-4 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border-default)]">
                <span className="text-sm font-semibold">Preference Categories</span>
              </div>
              <div className="divide-y divide-[var(--border-default)]">
                {categories.map((cat) => (
                  <div key={cat.category} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{cat.category}</span>
                      <span className="text-xs text-[var(--text-secondary)] ml-2">{cat.rules_count} rules</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span>{cat.avg_confidence}% avg confidence</span>
                      <span className="font-semibold">{cat.total_applications} applied</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
