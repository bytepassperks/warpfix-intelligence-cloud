"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import {
  Network, Globe, TrendingUp, Shield, Zap, BarChart3,
  AlertTriangle, ArrowRight, Eye, Target, Activity,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

const NETWORK_STATS = [
  { label: "Network Repos", value: "2,847", icon: Globe, change: "+127 this month", color: "text-cyan-600" },
  { label: "Predictions Made", value: "41,293", icon: Target, change: "87% accuracy", color: "text-violet-600" },
  { label: "Failures Prevented", value: "8,412", icon: Shield, change: "this quarter", color: "text-emerald-600" },
  { label: "Avg Prevention Lead", value: "4.2min", icon: Zap, change: "before CI runs", color: "text-amber-600" },
];

const PREDICTIONS = [
  {
    id: "pred_1",
    pattern: "Touching next.config.js with output: 'export' + API routes",
    probability: 87,
    basedOn: "2,400 similar PRs across 340 repos",
    failureType: "Build Error",
    suggestion: "API routes are incompatible with static export. Remove output: 'export' or convert API routes to server actions.",
    lastTriggered: "2 hours ago",
    prevented: 142,
  },
  {
    id: "pred_2",
    pattern: "Upgrading react to 19.x without updating react-dom",
    probability: 94,
    basedOn: "1,823 similar PRs across 289 repos",
    failureType: "Dependency Conflict",
    suggestion: "Always upgrade react and react-dom together. Run: pnpm add react@19 react-dom@19",
    lastTriggered: "45 minutes ago",
    prevented: 231,
  },
  {
    id: "pred_3",
    pattern: "Adding new env var in code without updating CI workflow",
    probability: 73,
    basedOn: "3,156 similar PRs across 521 repos",
    failureType: "Runtime Error",
    suggestion: "Add the new environment variable to your GitHub Actions workflow secrets and env block.",
    lastTriggered: "3 hours ago",
    prevented: 89,
  },
  {
    id: "pred_4",
    pattern: "Jest config change with --coverage flag on Node 20+",
    probability: 68,
    basedOn: "892 similar PRs across 156 repos",
    failureType: "Test Failure",
    suggestion: "Node 20 changed V8 coverage internals. Use --experimental-vm-modules or update jest to v30+.",
    lastTriggered: "1 day ago",
    prevented: 67,
  },
  {
    id: "pred_5",
    pattern: "Terraform provider version constraint change without lock file update",
    probability: 91,
    basedOn: "1,234 similar PRs across 198 repos",
    failureType: "Infrastructure Error",
    suggestion: "Run terraform init -upgrade && terraform providers lock to update .terraform.lock.hcl",
    lastTriggered: "5 hours ago",
    prevented: 178,
  },
];

const STACK_HEALTH = [
  {
    stack: "Next.js + TypeScript + Vercel",
    repos: 847, avgFailRate: 3.2, networkAvg: 4.1,
    topIssue: "Type errors in API routes after Next.js 15 upgrade",
    trend: "improving",
  },
  {
    stack: "React + Vite + GitHub Actions",
    repos: 623, avgFailRate: 2.8, networkAvg: 3.4,
    topIssue: "Vite 6 breaking changes in plugin API",
    trend: "stable",
  },
  {
    stack: "Python + pytest + Docker",
    repos: 412, avgFailRate: 4.7, networkAvg: 5.2,
    topIssue: "Python 3.13 deprecation warnings treated as errors",
    trend: "worsening",
  },
  {
    stack: "Go + goreleaser + GitHub Actions",
    repos: 289, avgFailRate: 1.9, networkAvg: 2.3,
    topIssue: "Go 1.23 module dependency resolution changes",
    trend: "improving",
  },
  {
    stack: "Terraform + Checkov + GitLab CI",
    repos: 198, avgFailRate: 5.1, networkAvg: 6.3,
    topIssue: "Checkov CKV2_AWS policies breaking on tf 1.8",
    trend: "stable",
  },
];

const NETWORK_ALERTS = [
  {
    severity: "high",
    message: "73% of PRs touching next.config.js with this pattern failed CI in the last 30 days",
    repos: 340,
    date: "Active",
  },
  {
    severity: "medium",
    message: "New breaking change detected in @types/react@19.1.0 — 156 repos affected so far",
    repos: 156,
    date: "2 hours ago",
  },
  {
    severity: "high",
    message: "Docker Hub rate limiting causing 42% more CI timeouts across Node.js repos this week",
    repos: 521,
    date: "Ongoing",
  },
  {
    severity: "low",
    message: "ESLint flat config migration causing 12% bump in lint failures for repos using v9+",
    repos: 89,
    date: "1 day ago",
  },
];

export default function NetworkIntelligencePage() {
  const [activeTab, setActiveTab] = useState<"predictions" | "stack" | "alerts">("predictions");

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
        {NETWORK_STATS.map((s, i) => (
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
              WarpFix sees CI failures across <strong>{NETWORK_STATS[0].value} repos</strong>. This means it can
              predict failures that haven&apos;t happened to <em>you</em> yet — but have happened to other repos using the same
              stack. Each new repo that joins the network makes predictions more accurate for everyone.
              A competitor with 100 repos cannot match the accuracy of a network with 2,847.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border-default)]">
        {[
          { id: "predictions" as const, label: "Pre-CI Predictions" },
          { id: "stack" as const, label: "Stack Health" },
          { id: "alerts" as const, label: "Network Alerts" },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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
            <span className="text-amber-700"> When a PR is opened, WarpFix analyzes the diff against {NETWORK_STATS[0].value} repos
            of historical data. If similar changes have caused CI failures, you get a warning before CI runs.</span>
          </div>

          {PREDICTIONS.map((pred) => (
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
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{pred.failureType}</span>
                  </div>
                  <p className="text-sm font-medium mt-1">{pred.pattern}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Based on <strong>{pred.basedOn}</strong>
                  </p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-emerald-600">{pred.prevented}</div>
                  <div className="text-xs text-[var(--text-secondary)]">prevented</div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)] flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-cyan-600 mt-0.5 shrink-0" />
                <p className="text-xs text-[var(--text-primary)]">{pred.suggestion}</p>
              </div>
              <div className="mt-2 text-xs text-[var(--text-secondary)]">
                Last triggered: {pred.lastTriggered}
              </div>
            </div>
          ))}

          <div className="p-3 rounded-lg bg-violet-50 border border-violet-200 text-xs text-violet-700">
            <strong>Network Confidence:</strong> Predictions are based on anonymized CI outcomes across the entire
            WarpFix network. No repo names, file paths, or code content from other organizations is ever exposed.
          </div>
        </div>
      )}

      {/* Tab: Stack Health */}
      {activeTab === "stack" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-600" />
            Stack Health Digest
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Compare your CI health against the WarpFix network average for your tech stack.
          </p>

          {STACK_HEALTH.map((stack) => (
            <div key={stack.stack}
              className="p-4 rounded-xl border border-[var(--border-default)] bg-white">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold">{stack.stack}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">{stack.repos} repos in network</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  stack.trend === "improving" ? "bg-emerald-100 text-emerald-700" :
                  stack.trend === "worsening" ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {stack.trend === "improving" ? "↑ Improving" :
                   stack.trend === "worsening" ? "↓ Worsening" : "→ Stable"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-[var(--text-secondary)]">Your Fail Rate</div>
                  <div className={`text-lg font-bold ${
                    stack.avgFailRate <= stack.networkAvg ? "text-emerald-600" : "text-red-600"
                  }`}>{stack.avgFailRate}%</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-secondary)]">Network Avg</div>
                  <div className="text-lg font-bold text-gray-600">{stack.networkAvg}%</div>
                </div>
              </div>

              <div className="p-2 rounded bg-[var(--bg-secondary)] text-xs">
                <span className="font-medium">Top issue:</span> {stack.topIssue}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Network Alerts */}
      {activeTab === "alerts" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-cyan-600" />
            Network-Wide Alerts
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Trends and emerging issues detected across the WarpFix network.
          </p>

          {NETWORK_ALERTS.map((alert, i) => (
            <div key={i}
              className={`p-4 rounded-xl border bg-white ${
                alert.severity === "high" ? "border-red-200" :
                alert.severity === "medium" ? "border-amber-200" :
                "border-[var(--border-default)]"
              }`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                  alert.severity === "high" ? "text-red-500" :
                  alert.severity === "medium" ? "text-amber-500" :
                  "text-gray-400"
                }`} />
                <div className="flex-1">
                  <p className="text-sm">{alert.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-secondary)]">
                    <span>{alert.repos} repos affected</span>
                    <span>{alert.date}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-xl border border-[var(--border-default)]">
              <Activity className="w-5 h-5 text-cyan-600 mb-2" />
              <h3 className="text-sm font-medium mb-1">Real-Time Detection</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Alerts are generated by analyzing CI outcome trends across the entire network in real-time.
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
