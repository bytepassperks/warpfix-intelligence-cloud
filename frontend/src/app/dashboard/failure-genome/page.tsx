"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Dna, TrendingUp, Globe, Hash, Clock, BarChart3,
  ChevronDown, ChevronUp, ArrowUpRight, Shield, Layers, Loader2,
} from "lucide-react";
import { API_URL } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

const CATEGORY_COLORS: Record<string, string> = {
  type_error: "bg-blue-500",
  runtime_error: "bg-red-500",
  build_error: "bg-amber-500",
  lint_error: "bg-emerald-500",
  dependency_error: "bg-purple-500",
  test_failure: "bg-orange-500",
  infra_error: "bg-cyan-500",
  security_error: "bg-rose-500",
  import_error: "bg-indigo-500",
};

const CATEGORY_BADGE: Record<string, string> = {
  type_error: "bg-blue-100 text-blue-700",
  runtime_error: "bg-red-100 text-red-700",
  build_error: "bg-amber-100 text-amber-700",
  lint_error: "bg-emerald-100 text-emerald-700",
  dependency_error: "bg-purple-100 text-purple-700",
  test_failure: "bg-orange-100 text-orange-700",
  infra_error: "bg-cyan-100 text-cyan-700",
  security_error: "bg-rose-100 text-rose-700",
  import_error: "bg-indigo-100 text-indigo-700",
};

interface GenomeData {
  overview: {
    totalFingerprints: number;
    uniqueCategories: number;
    totalMatches: number;
    avgConfidence: number;
  };
  fingerprints: {
    id: string;
    hash: string;
    error_pattern: string;
    dependency_context: { framework?: string; category?: string } | null;
    resolution_confidence: number;
    times_matched: number;
    last_matched_at: string;
    created_at: string;
  }[];
  categories: {
    category: string;
    count: string;
    total_matches: string;
    avg_confidence: string;
  }[];
  monthlyIndex: {
    month_year: string;
    new_patterns: number;
    total_matches: number;
    avg_confidence: number;
    top_category: string;
  }[];
}

export default function FailureGenomePage() {
  const [expandedFp, setExpandedFp] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"index" | "explorer" | "categories">("index");
  const [data, setData] = useState<GenomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_URL}/api/intelligence/failure-genome`, { credentials: "include" });
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
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          Failed to load Failure Genome data: {error || "No data available"}
        </div>
      </div>
    );
  }

  const { overview, fingerprints, categories, monthlyIndex } = data;
  const totalCatMatches = categories.reduce((s, c) => s + parseInt(c.total_matches), 0);

  const statsCards = [
    { label: "Total Fingerprints", value: overview.totalFingerprints.toLocaleString(), icon: Dna, change: monthlyIndex[0] ? `+${monthlyIndex[0].new_patterns} this month` : "", color: "text-violet-600" },
    { label: "Unique Categories", value: overview.uniqueCategories.toLocaleString(), icon: Hash, change: `${categories.length} active`, color: "text-blue-600" },
    { label: "Cross-Repo Matches", value: overview.totalMatches.toLocaleString(), icon: Globe, change: `${overview.totalFingerprints > 0 ? (overview.totalMatches / overview.totalFingerprints).toFixed(1) : 0}x avg reuse`, color: "text-emerald-600" },
    { label: "Avg Confidence", value: `${overview.avgConfidence}%`, icon: Clock, change: "across all patterns", color: "text-amber-600" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
        <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
            <Dna className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">CI Failure Genome</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Proprietary database of CI failure patterns — growing smarter with every repo
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Stats */}
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((s, i) => (
          <motion.div key={s.label} variants={fadeUp} custom={i}
            className="p-4 rounded-xl border border-[var(--border-default)] bg-white">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-[var(--text-secondary)]">{s.label}</span>
            </div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-emerald-600 mt-1">{s.change}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Info banner */}
      <div className="p-4 rounded-xl bg-violet-50 border border-violet-200">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-violet-900">How the CI Failure Genome Works</p>
            <p className="text-xs text-violet-700 mt-1">
              Every CI failure processed by WarpFix is normalized, hashed, and stored as a fingerprint.
              Validated fixes are linked to their fingerprints with confidence scores.
              When the same pattern recurs — in your repo or across the network — the proven fix is applied instantly.
              Human edits to WarpFix PRs teach the system where fixes were imperfect, improving accuracy over time.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-default)]">
        {[
          { id: "index" as const, label: "Failure Index" },
          { id: "explorer" as const, label: "Fingerprint Explorer" },
          { id: "categories" as const, label: "Category Breakdown" },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Failure Index */}
      {activeTab === "index" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-600" />
              Monthly CI Failure Index
            </h2>
            <span className="text-xs text-[var(--text-secondary)]">Public transparency report</span>
          </div>
          <div className="rounded-xl border border-[var(--border-default)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-secondary)]">
                  <th className="text-left p-3 font-medium">Month</th>
                  <th className="text-right p-3 font-medium">New Patterns</th>
                  <th className="text-right p-3 font-medium">Total Matches</th>
                  <th className="text-right p-3 font-medium">Avg Confidence</th>
                  <th className="text-right p-3 font-medium">Top Category</th>
                </tr>
              </thead>
              <tbody>
                {monthlyIndex.map((m) => (
                  <tr key={m.month_year} className="border-t border-[var(--border-default)]">
                    <td className="p-3 font-medium">{m.month_year}</td>
                    <td className="p-3 text-right text-violet-600">+{m.new_patterns}</td>
                    <td className="p-3 text-right">{m.total_matches.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        m.avg_confidence >= 85 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}>{m.avg_confidence}%</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-xs">{m.top_category.replace("_", " ")}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--text-secondary)]">
            The CI Failure Index is a monthly transparency report showing the most common CI failure patterns across the WarpFix network.
            All data is anonymized — no repo names, file paths, or code content is exposed.
          </p>
        </div>
      )}

      {/* Tab: Fingerprint Explorer */}
      {activeTab === "explorer" && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="w-5 h-5 text-violet-600" />
            Top Fingerprints by Match Count
          </h2>
          {fingerprints.slice(0, 20).map((fp) => {
            const ctx = fp.dependency_context || {};
            const category = ctx.category || "unknown";
            const framework = ctx.framework || "unknown";
            return (
              <div key={fp.id}
                className="rounded-xl border border-[var(--border-default)] bg-white overflow-hidden">
                <button
                  onClick={() => setExpandedFp(expandedFp === fp.hash ? null : fp.hash)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded font-mono">{fp.hash.slice(0, 12)}</code>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${CATEGORY_BADGE[category] || "bg-gray-100 text-gray-700"}`}>
                        {category.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm font-mono text-[var(--text-primary)] truncate">{fp.error_pattern}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      {framework} &middot; Last matched {new Date(fp.last_matched_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <div className="text-right">
                      <div className="text-lg font-bold">{fp.times_matched.toLocaleString()}</div>
                      <div className="text-xs text-[var(--text-secondary)]">matches</div>
                    </div>
                    {expandedFp === fp.hash ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {expandedFp === fp.hash && (
                  <div className="p-4 border-t border-[var(--border-default)] bg-[var(--bg-secondary)]">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs text-[var(--text-secondary)]">Confidence</div>
                        <div className="text-lg font-semibold text-emerald-600">{fp.resolution_confidence}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-secondary)]">Total Matches</div>
                        <div className="text-lg font-semibold">{fp.times_matched.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-secondary)]">First Seen</div>
                        <div className="text-lg font-semibold">{new Date(fp.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {fingerprints.length === 0 && (
            <div className="py-8 text-center text-sm text-[var(--text-tertiary)]">
              No fingerprints yet. Patterns will appear here as WarpFix processes CI failures.
            </div>
          )}
        </div>
      )}

      {/* Tab: Category Breakdown */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">Failure Categories</h2>
          <div className="space-y-3">
            {categories.map((cat) => {
              const matches = parseInt(cat.total_matches);
              const pct = totalCatMatches > 0 ? Math.round((matches / totalCatMatches) * 100) : 0;
              const barColor = CATEGORY_COLORS[cat.category] || "bg-gray-400";
              return (
                <div key={cat.category} className="flex items-center gap-4">
                  <div className="w-36 text-sm font-medium capitalize">{cat.category.replace("_", " ")}</div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full flex items-center justify-end pr-2`}
                      style={{ width: `${Math.max(pct, 3)}%` }}>
                      {pct >= 8 && <span className="text-[10px] text-white font-medium">{pct}%</span>}
                    </div>
                  </div>
                  <div className="w-20 text-right text-sm text-[var(--text-secondary)]">{matches.toLocaleString()}</div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Data Flywheel Effect</p>
                <p className="text-xs text-blue-700 mt-1">
                  Every CI failure processed makes WarpFix smarter. With {overview.totalFingerprints.toLocaleString()} fingerprints across
                  {" "}{overview.totalMatches.toLocaleString()} matches, WarpFix has a fix accuracy that competitors starting from zero
                  would need 2-3 years of active adoption to replicate. Your fixes improve because the network grows.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-[var(--border-default)]">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="w-4 h-4 text-violet-600" />
                <span className="text-sm font-medium">Compounding Advantage</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                Each new repo that joins WarpFix contributes failure patterns that benefit every other user.
                A newcomer starting today cannot replicate this dataset.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-default)]">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Anonymous and Secure</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                All patterns are normalized and anonymized. No repo names, file paths, or code content
                leaves your organization. Only abstract error patterns and fix templates are shared.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-default)]">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium">Instant Fix Reuse</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                When a fingerprint matches a known pattern, the validated fix is applied in under 1 second —
                no LLM call needed. That is 400x faster than generating a new fix from scratch.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
