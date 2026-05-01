"use client";

import { motion } from "framer-motion";
import { Package, AlertTriangle, ArrowUp, ShieldAlert, Clock, CheckCircle2 } from "lucide-react";

const ALERTS = [
  {
    pkg: "lodash",
    current: "4.17.20",
    latest: "4.17.21",
    severity: "critical",
    reason: "CVE-2021-23337 — Command Injection in lodash",
    type: "security",
    ecosystem: "npm",
    age: "340 days outdated",
  },
  {
    pkg: "axios",
    current: "0.21.1",
    latest: "1.7.9",
    severity: "high",
    reason: "CVE-2023-45857 — CSRF vulnerability via cookie exposure",
    type: "security",
    ecosystem: "npm",
    age: "890 days outdated",
  },
  {
    pkg: "webpack",
    current: "5.75.0",
    latest: "5.97.1",
    severity: "medium",
    reason: "Multiple minor security patches and performance improvements",
    type: "outdated",
    ecosystem: "npm",
    age: "560 days outdated",
  },
  {
    pkg: "express",
    current: "4.18.2",
    latest: "4.21.2",
    severity: "low",
    reason: "Bug fixes and minor improvements — no breaking changes",
    type: "outdated",
    ecosystem: "npm",
    age: "400 days outdated",
  },
  {
    pkg: "request",
    current: "2.88.2",
    latest: "—",
    severity: "high",
    reason: "Package deprecated — use undici, node-fetch, or axios instead",
    type: "deprecated",
    ecosystem: "npm",
    age: "Deprecated since 2020",
  },
  {
    pkg: "moment",
    current: "2.29.4",
    latest: "—",
    severity: "medium",
    reason: "Package in maintenance mode — migrate to dayjs, date-fns, or Temporal API",
    type: "deprecated",
    ecosystem: "npm",
    age: "Maintenance mode",
  },
];

export default function DependencyAlertsPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Dependency Hygiene</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Outdated, deprecated, and vulnerable packages across your repositories. No LLM cost — just static analysis of your dependency tree.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Security Alerts", value: "2", icon: ShieldAlert, color: "text-red-600" },
          { label: "Outdated Packages", value: "14", icon: ArrowUp, color: "text-amber-600" },
          { label: "Deprecated", value: "3", icon: AlertTriangle, color: "text-orange-600" },
          { label: "Up to Date", value: "127", icon: CheckCircle2, color: "text-green-600" },
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

      {/* Alerts list */}
      <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border-default)] flex items-center justify-between">
          <span className="text-[13px] font-semibold">Dependency Alerts</span>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium">2 Critical</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">2 High</span>
          </div>
        </div>
        <div className="divide-y divide-[var(--border-default)]">
          {ALERTS.map((alert) => (
            <motion.div
              key={alert.pkg}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-5 py-4 hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <span className="text-[14px] font-semibold text-[var(--text-primary)] font-mono">{alert.pkg}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    alert.type === "security" ? "bg-red-50 text-red-700 border border-red-200"
                    : alert.type === "deprecated" ? "bg-orange-50 text-orange-700 border border-orange-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {alert.type === "security" ? "Security" : alert.type === "deprecated" ? "Deprecated" : "Outdated"}
                  </span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  alert.severity === "critical" ? "bg-red-100 text-red-800"
                  : alert.severity === "high" ? "bg-red-50 text-red-700"
                  : alert.severity === "medium" ? "bg-amber-50 text-amber-700"
                  : "bg-gray-50 text-gray-600"
                }`}>
                  {alert.severity}
                </span>
              </div>
              <p className="text-[12px] text-[var(--text-secondary)] mb-2">{alert.reason}</p>
              <div className="flex items-center gap-4 text-[11px] text-[var(--text-tertiary)]">
                <span className="font-mono">v{alert.current} → {alert.latest !== "—" ? `v${alert.latest}` : "No replacement"}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{alert.age}</span>
                <span className="text-[var(--text-tertiary)]">{alert.ecosystem}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-lg text-center">
        <p className="text-[13px] text-[var(--text-secondary)]">
          Dependency alerts are free on all plans. Upgrade to Pro for automatic version-bump PRs.
        </p>
      </div>
    </div>
  );
}
