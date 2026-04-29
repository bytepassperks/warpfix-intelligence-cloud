"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://warpfix-api.onrender.com";

export default function KnowledgePage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`${API}/api/analytics/knowledge`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {});
  }, []);

  const learningStats = (data?.learning_stats || {}) as Record<string, number>;
  const fingerprintStats = (data?.fingerprint_stats || {}) as Record<string, number>;
  const recentLearnings = (data?.recent_learnings || []) as Array<Record<string, unknown>>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Knowledge Base</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Learnings</h3>
          <div className="space-y-3">
            <StatRow label="Total Learnings" value={learningStats.total || 0} />
            <StatRow label="Active Rules" value={learningStats.active || 0} />
            <StatRow label="Repos with Learnings" value={learningStats.repos_with_learnings || 0} />
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
            Learnings are rules extracted from developer feedback on reviews. They improve future review accuracy.
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Repair Fingerprints</h3>
          <div className="space-y-3">
            <StatRow label="Total Fingerprints" value={fingerprintStats.total || 0} />
            <StatRow label="Times Matched" value={fingerprintStats.total_matches || 0} />
            <StatRow label="Avg Confidence" value={fingerprintStats.avg_confidence || 0} />
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
            Fingerprints are SHA-256 hashes of error patterns. When the same error appears again, cached fixes are reused instantly.
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-muted font-semibold text-sm">Recent Learnings</div>
        <div className="divide-y divide-border">
          {recentLearnings.map((l, i) => (
            <div key={i} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-xs ${(l.active as boolean) ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}>
                  {(l.active as boolean) ? "Active" : "Inactive"}
                </span>
                <span className="text-xs text-muted-foreground">{l.category as string}</span>
                <span className="text-xs text-muted-foreground">from {l.source as string}</span>
              </div>
              <div className="text-sm">{l.rule as string}</div>
              {l.repo_name ? <div className="text-xs text-muted-foreground mt-1">{String(l.repo_name)}</div> : null}
            </div>
          ))}
          {recentLearnings.length === 0 && (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">No learnings yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-lg font-bold">{typeof value === "number" ? Math.round(value).toLocaleString() : value}</span>
    </div>
  );
}
