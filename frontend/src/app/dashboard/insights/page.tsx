"use client";

import { motion } from "framer-motion";
import { TrendingUp, Fingerprint, FlaskConical, FileWarning, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { API_URL, formatRelativeTime } from "@/lib/utils";

interface InsightsData {
  fingerprints: { hash: string; pattern: string; count: number; last_seen: string; confidence: number }[];
  flakyTests: { name: string; file: string; flake_rate: string; runs: string; last_flake: string }[];
  failureFiles: { path: string; failures: string; pct: string; last_fail: string }[];
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/intelligence/insights`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const fingerprints = data?.fingerprints || [];
  const flakyTests = data?.flakyTests || [];
  const failureFiles = data?.failureFiles || [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Insights</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Cross-cutting intelligence drawn from fingerprints, test data, and failure patterns.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-6">
        {[
          { label: "Fingerprints", value: fingerprints.length, icon: Fingerprint, color: "text-indigo-600" },
          { label: "Flaky Tests", value: flakyTests.length, icon: FlaskConical, color: "text-amber-600" },
          { label: "Failure Hotspots", value: failureFiles.length, icon: FileWarning, color: "text-red-600" },
        ].map((card) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-[var(--border-default)] p-4">
            <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
            <div className="text-xl font-bold text-[var(--text-primary)]">{card.value}</div>
            <div className="text-[12px] text-[var(--text-tertiary)]">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Top Fingerprints */}
      <div className="mb-6">
        <h2 className="text-[15px] font-semibold mb-3">Top Fingerprints</h2>
        {fingerprints.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-tertiary)] text-[13px]">No fingerprints yet.</div>
        ) : (
          <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
                  <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Pattern</th>
                  <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Matches</th>
                  <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Confidence</th>
                  <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {fingerprints.map((fp) => (
                  <tr key={fp.hash} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-secondary)]">
                    <td className="py-3 px-5">
                      <div className="font-mono text-[12px] text-[var(--text-primary)] truncate max-w-[300px]">{fp.pattern}</div>
                      <div className="text-[11px] text-[var(--text-tertiary)]">{fp.hash}</div>
                    </td>
                    <td className="py-3 px-5 text-[var(--text-secondary)]">{fp.count.toLocaleString()}</td>
                    <td className="py-3 px-5">
                      <span className={`font-semibold ${fp.confidence >= 90 ? "text-green-600" : fp.confidence >= 70 ? "text-amber-600" : "text-red-600"}`}>
                        {fp.confidence}%
                      </span>
                    </td>
                    <td className="py-3 px-5 text-[var(--text-tertiary)]">{formatRelativeTime(fp.last_seen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Flaky Tests */}
      {flakyTests.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[15px] font-semibold mb-3">Top Flaky Tests</h2>
          <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
                  <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Test</th>
                  <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Flake Rate</th>
                  <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Runs</th>
                </tr>
              </thead>
              <tbody>
                {flakyTests.map((t) => (
                  <tr key={t.name} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-secondary)]">
                    <td className="py-3 px-5">
                      <div className="font-medium text-[var(--text-primary)]">{t.name}</div>
                      <div className="text-[11px] text-[var(--text-tertiary)] font-mono">{t.file}</div>
                    </td>
                    <td className="py-3 px-5 font-semibold text-amber-600">{t.flake_rate}%</td>
                    <td className="py-3 px-5 text-[var(--text-secondary)]">{t.runs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Failure Hotspots */}
      {failureFiles.length > 0 && (
        <div>
          <h2 className="text-[15px] font-semibold mb-3">Failure Hotspot Files</h2>
          <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
                  <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">File</th>
                  <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Failures</th>
                  <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Fail %</th>
                </tr>
              </thead>
              <tbody>
                {failureFiles.map((f) => (
                  <tr key={f.path} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-secondary)]">
                    <td className="py-3 px-5 font-mono text-[12px] text-[var(--text-primary)]">{f.path}</td>
                    <td className="py-3 px-5 text-red-600 font-medium">{f.failures}</td>
                    <td className="py-3 px-5 text-[var(--text-secondary)]">{f.pct}%</td>
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
