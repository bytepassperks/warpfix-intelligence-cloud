"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://warpfix-api.onrender.com";

export default function SecurityPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`${API}/api/analytics/security`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {});
  }, []);

  const vulnStats = (data?.vulnerability_stats || {}) as Record<string, number>;
  const alerts = (data?.unresolved_alerts || []) as Array<Record<string, unknown>>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Security Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Security Scans (30d)</div>
          <div className="text-2xl font-bold mt-1">{vulnStats.total_scans || 0}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Issues Found</div>
          <div className="text-2xl font-bold mt-1 text-yellow-500">{vulnStats.total_issues || 0}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Critical Issues</div>
          <div className="text-2xl font-bold mt-1 text-red-500">{vulnStats.critical_issues || 0}</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h3 className="font-semibold mb-2">Security Checks</h3>
        <p className="text-sm text-muted-foreground mb-4">WarpFix scans every PR for OWASP Top 10 vulnerabilities:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          {["Broken Access Control", "Cryptographic Failures", "Injection", "Security Misconfiguration", "Auth Failures", "SSRF", "XSS", "SQL Injection", "Prototype Pollution", "Hardcoded Secrets"].map((check) => (
            <div key={check} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              {check}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-muted font-semibold text-sm">Unresolved Dependency Alerts</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left">Package</th>
              <th className="px-4 py-2 text-left">Repository</th>
              <th className="px-4 py-2 text-left">Severity</th>
              <th className="px-4 py-2 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((a, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-4 py-2 font-mono text-xs">{a.package_name as string}</td>
                <td className="px-4 py-2 text-muted-foreground">{a.repo_name as string}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${(a.severity as string) === "critical" ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"}`}>
                    {a.severity as string}
                  </span>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{a.description as string}</td>
              </tr>
            ))}
            {alerts.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No unresolved alerts</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
