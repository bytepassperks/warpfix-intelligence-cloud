"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://warpfix-api.onrender.com";

export default function QualityPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`${API}/api/analytics/quality`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {});
  }, []);

  const stats = (data?.review_stats || {}) as Record<string, number>;
  const severity = (data?.severity_breakdown || {}) as Record<string, number>;
  const categories = (data?.top_issue_categories || []) as Array<{ category: string; count: string }>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Code Quality Metrics</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Reviews (30d)</div>
          <div className="text-2xl font-bold mt-1">{stats.total_reviews || 0}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Avg Effort Level</div>
          <div className="text-2xl font-bold mt-1">{(stats.avg_effort || 0).toFixed(1)}/5</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">Critical PRs</div>
          <div className="text-2xl font-bold mt-1 text-red-500">{stats.critical_count || 0}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground">High Risk PRs</div>
          <div className="text-2xl font-bold mt-1 text-orange-500">{stats.high_count || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Issue Severity Distribution</h3>
          <div className="space-y-3">
            <SeverityBar label="Critical" count={severity.critical || 0} color="bg-red-500" max={Math.max(severity.critical || 0, severity.warnings || 0, severity.nitpicks || 0, 1)} />
            <SeverityBar label="Warnings" count={severity.warnings || 0} color="bg-yellow-500" max={Math.max(severity.critical || 0, severity.warnings || 0, severity.nitpicks || 0, 1)} />
            <SeverityBar label="Nitpicks" count={severity.nitpicks || 0} color="bg-blue-500" max={Math.max(severity.critical || 0, severity.warnings || 0, severity.nitpicks || 0, 1)} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Top Issue Categories</h3>
          <div className="space-y-2">
            {categories.map((c, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm">{c.category || "unknown"}</span>
                <span className="text-sm font-mono text-muted-foreground">{c.count}</span>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="text-sm text-muted-foreground">No data yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SeverityBar({ label, count, color, max }: { label: string; count: number; color: string; max: number }) {
  const width = max > 0 ? (count / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted-foreground">{count}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
