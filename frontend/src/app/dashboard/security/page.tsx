"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard, SkeletonTable } from "@/components/ui/skeleton";
import { API_URL } from "@/lib/utils";
import { UpgradeGate } from "@/components/ui/upgrade-gate";

const OWASP_CHECKS = [
  "Broken Access Control", "Cryptographic Failures", "Injection",
  "Security Misconfiguration", "Auth Failures", "SSRF",
  "XSS", "SQL Injection", "Prototype Pollution", "Hardcoded Secrets",
];

export default function SecurityPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [gated, setGated] = useState<{feature: string; currentPlan: string; requiredPlan: string} | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/analytics/security`, { credentials: "include" })
      .then(async (r) => { if (r.status === 403) { const b = await r.json(); if (b.feature) { setGated({ feature: b.feature, currentPlan: b.current_plan || "free", requiredPlan: b.required_plan || "pro" }); return null; } } return r.ok ? r.json() : null; })
      .then(setData)
      .catch(() => setData({}));
  }, []);

  const vulnStats = (data?.vulnerability_stats || {}) as Record<string, number>;
  const alerts = (data?.unresolved_alerts || []) as Array<Record<string, unknown>>;

  if (gated) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <UpgradeGate feature={gated.feature} requiredPlan={gated.requiredPlan} currentPlan={gated.currentPlan} />
      </div>
    );
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-xl font-semibold">Security</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
          Vulnerability scanning and dependency security
        </p>
      </motion.div>

      {data === null ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Security Scans", value: vulnStats.total_scans || 0 },
              { label: "Issues Found", value: vulnStats.total_issues || 0, color: "text-amber-500" },
              { label: "Critical Issues", value: vulnStats.critical_issues || 0, color: "text-red-500" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-lg border border-[var(--border-default)] p-5"
              >
                <div className="text-[13px] text-[var(--text-secondary)]">{s.label}</div>
                <div className={`text-2xl font-bold mt-1 ${s.color || ""}`}>{s.value}</div>
              </motion.div>
            ))}
          </div>

          <div className="bg-white rounded-lg border border-[var(--border-default)] p-6 mb-6">
            <h3 className="font-semibold text-[15px] mb-3">OWASP Coverage</h3>
            <p className="text-[13px] text-[var(--text-secondary)] mb-4">WarpFix scans every PR for these vulnerabilities:</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {OWASP_CHECKS.map((check) => (
                <div key={check} className="flex items-center gap-2 text-[13px] p-2 rounded-md bg-[var(--bg-secondary)]">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{check}</span>
                </div>
              ))}
            </div>
          </div>

          {alerts.length > 0 ? (
            <div className="bg-white rounded-lg border border-[var(--border-default)] overflow-hidden">
              <div className="px-5 py-3 border-b border-[var(--border-default)] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-[14px]">Unresolved Alerts</span>
              </div>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
                    <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Package</th>
                    <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Repository</th>
                    <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Severity</th>
                    <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a, i) => (
                    <tr key={i} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors">
                      <td className="py-3 px-5 font-mono text-xs">{a.package_name as string}</td>
                      <td className="py-3 px-5 text-[var(--text-secondary)]">{a.repo_name as string}</td>
                      <td className="py-3 px-5">
                        <Badge variant={(a.severity as string) === "critical" ? "error" : "warning"}>
                          {a.severity as string}
                        </Badge>
                      </td>
                      <td className="py-3 px-5 text-[var(--text-secondary)]">{a.description as string}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={Shield}
              title="No unresolved alerts"
              description="All dependency vulnerabilities have been resolved. WarpFix continues scanning on every PR."
            />
          )}
        </>
      )}
    </div>
  );
}
