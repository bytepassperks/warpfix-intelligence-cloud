"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Network, Globe, TrendingUp, Shield, Zap, BarChart3,
  AlertTriangle, ArrowRight, Eye, Target, Activity, Loader2,
} from "lucide-react";
import { API_URL } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

interface NetworkData {
  overview: {
    totalRepos: number;
    totalPRs: number;
    totalPrevented: number;
    avgAccuracy: number;
  };
  predictions: {
    id: string;
    pattern_type: string;
    description: string;
    probability: number;
    category: string;
    based_on_prs: number;
    based_on_repos: number;
    times_prevented: number;
    suggestion: string;
    last_triggered_at: string;
  }[];
  categoryDistribution: {
    category: string;
    count: string;
    prevented: string;
    avg_probability: string;
  }[];
  frameworkBreakdown: {
    framework: string;
    patterns: string;
    total_matches: string;
  }[];
}

export default function NetworkIntelligencePage() {
  const [activeTab, setActiveTab] = useState<"predictions" | "stack" | "alerts">("predictions");
  const [data, setData] = useState<NetworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_URL}/api/intelligence/network-intelligence`, { credentials: "include" });
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
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          Failed to load Network Intelligence data: {error || "No data available"}
        </div>
      </div>
    );
  }

  const { overview, predictions, categoryDistribution, frameworkBreakdown } = data;

  const statsCards = [
    { label: "Network Repos", value: overview.totalRepos.toLocaleString(), icon: Globe, change: `${predictions.length} active patterns`, color: "text-cyan-600" },
    { label: "Predictions Made", value: overview.totalPRs.toLocaleString(), icon: Target, change: `${overview.avgAccuracy}% accuracy`, color: "text-violet-600" },
    { label: "Failures Prevented", value: overview.totalPrevented.toLocaleString(), icon: Shield, change: "across all repos", color: "text-emerald-600" },
    { label: "Avg Accuracy", value: `${overview.avgAccuracy}%`, icon: Zap, change: "network-wide", color: "text-amber-600" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.06 } } }}>
        <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
            <Network className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Network Intelligence</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Cross-repo predictive failure intelligence — powered by the WarpFix network
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

      {/* Network Effect Explainer */}
      <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-cyan-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-cyan-900">Data Network Effect</p>
            <p className="text-xs text-cyan-700 mt-1">
              WarpFix sees CI failures across <strong>{overview.totalRepos.toLocaleString()} repos</strong>. This means it can
              predict failures that haven&apos;t happened to <em>you</em> yet — but have happened to other repos using the same
              stack. Each new repo that joins the network makes predictions more accurate for everyone.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-default)] overflow-x-auto">
        {[
          { id: "predictions" as const, label: "Pre-CI Predictions" },
          { id: "stack" as const, label: "Framework Breakdown" },
          { id: "alerts" as const, label: "Category Distribution" },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-cyan-600 text-cyan-600"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Predictions */}
      {activeTab === "predictions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-600" />
              Pre-CI Failure Predictions
            </h2>
            <span className="text-xs text-[var(--text-secondary)]">Before CI even runs</span>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm">
            <span className="font-medium text-amber-800">How it works:</span>
            <span className="text-amber-700"> When a PR is opened, WarpFix analyzes the diff against {overview.totalRepos.toLocaleString()} repos
            of historical data. If similar changes have caused CI failures, you get a warning before CI runs.</span>
          </div>

          {predictions.map((pred) => (
            <div key={pred.id}
              className="p-4 rounded-xl border border-[var(--border-default)] bg-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                      pred.probability >= 85 ? "bg-red-100 text-red-700" :
                      pred.probability >= 70 ? "bg-amber-100 text-amber-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>{pred.probability}% probability</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{pred.category}</span>
                  </div>
                  <p className="text-sm font-medium mt-1">{pred.description}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Based on <strong>{pred.based_on_prs.toLocaleString()} PRs across {pred.based_on_repos.toLocaleString()} repos</strong>
                  </p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-emerald-600">{pred.times_prevented}</div>
                  <div className="text-xs text-[var(--text-secondary)]">prevented</div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)] flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-cyan-600 mt-0.5 shrink-0" />
                <p className="text-xs text-[var(--text-primary)]">{pred.suggestion}</p>
              </div>
              <div className="mt-2 text-xs text-[var(--text-secondary)]">
                Last triggered: {new Date(pred.last_triggered_at).toLocaleDateString()}
              </div>
            </div>
          ))}

          {predictions.length === 0 && (
            <div className="py-8 text-center text-sm text-[var(--text-tertiary)]">
              No predictions yet. Network intelligence builds as more repos join WarpFix.
            </div>
          )}

          <div className="p-3 rounded-lg bg-violet-50 border border-violet-200 text-xs text-violet-700">
            <strong>Network Confidence:</strong> Predictions are based on anonymized CI outcomes across the entire
            WarpFix network. No repo names, file paths, or code content from other organizations is ever exposed.
          </div>
        </div>
      )}

      {/* Tab: Framework Breakdown */}
      {activeTab === "stack" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-600" />
            Framework Breakdown
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Failure patterns grouped by framework — showing which ecosystems generate the most CI issues.
          </p>

          <div className="rounded-xl border border-[var(--border-default)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-secondary)]">
                  <th className="text-left p-3 font-medium">Framework</th>
                  <th className="text-right p-3 font-medium">Patterns</th>
                  <th className="text-right p-3 font-medium">Total Matches</th>
                </tr>
              </thead>
              <tbody>
                {frameworkBreakdown.map((fw) => (
                  <tr key={fw.framework} className="border-t border-[var(--border-default)]">
                    <td className="p-3 font-medium capitalize">{fw.framework}</td>
                    <td className="p-3 text-right">{fw.patterns}</td>
                    <td className="p-3 text-right font-semibold">{parseInt(fw.total_matches).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Category Distribution */}
      {activeTab === "alerts" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-cyan-600" />
            Prediction Categories
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Distribution of prediction patterns by failure category.
          </p>

          {categoryDistribution.map((cat) => (
            <div key={cat.category}
              className="p-4 rounded-xl border border-[var(--border-default)] bg-white">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">{cat.category}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-100 text-cyan-700 font-medium">
                  {cat.avg_probability}% avg probability
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[var(--text-secondary)]">Active patterns: </span>
                  <span className="font-semibold">{cat.count}</span>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)]">Failures prevented: </span>
                  <span className="font-semibold text-emerald-600">{parseInt(cat.prevented).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-xl border border-[var(--border-default)]">
              <Activity className="w-5 h-5 text-cyan-600 mb-2" />
              <h3 className="text-sm font-medium mb-1">Real-Time Detection</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Predictions are generated by analyzing CI outcome trends across the entire network in real time.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-default)]">
              <Shield className="w-5 h-5 text-emerald-600 mb-2" />
              <h3 className="text-sm font-medium mb-1">Proactive Protection</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Get warned about emerging issues before they hit your repos —
                because another repo in the network already experienced it.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[var(--border-default)]">
              <TrendingUp className="w-5 h-5 text-violet-600 mb-2" />
              <h3 className="text-sm font-medium mb-1">Self-Reinforcing</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                The more repos in the network, the earlier issues are detected and the more accurate predictions become.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
