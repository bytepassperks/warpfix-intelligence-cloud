"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://warpfix-api.onrender.com";

export default function TrendsPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`${API}/api/analytics/trends`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {});
  }, []);

  const repairTrend = (data?.repair_trend || []) as Array<{ day: string; count: number; successful: number }>;
  const reviewTrend = (data?.review_trend || []) as Array<{ day: string; count: number }>;
  const confidenceTrend = (data?.confidence_trend || []) as Array<{ day: string; avg_confidence: number }>;
  const failureTypes = (data?.failure_type_distribution || []) as Array<{ type: string; count: string }>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Trends</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Repair Activity (30d)</h3>
          <div className="space-y-1">
            {repairTrend.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-20 text-muted-foreground">{new Date(d.day).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                <div className="flex-1 flex gap-1">
                  <div className="bg-primary h-4 rounded" style={{ width: `${Math.min(d.count * 10, 100)}%` }} />
                </div>
                <span className="w-8 text-right">{d.count}</span>
              </div>
            ))}
            {repairTrend.length === 0 && <div className="text-sm text-muted-foreground">No data yet</div>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Review Activity (30d)</h3>
          <div className="space-y-1">
            {reviewTrend.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-20 text-muted-foreground">{new Date(d.day).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                <div className="flex-1">
                  <div className="bg-blue-500 h-4 rounded" style={{ width: `${Math.min(d.count * 10, 100)}%` }} />
                </div>
                <span className="w-8 text-right">{d.count}</span>
              </div>
            ))}
            {reviewTrend.length === 0 && <div className="text-sm text-muted-foreground">No data yet</div>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Confidence Trend</h3>
          <div className="space-y-1">
            {confidenceTrend.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-20 text-muted-foreground">{new Date(d.day).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                <div className="flex-1">
                  <div className="bg-green-500 h-4 rounded" style={{ width: `${d.avg_confidence}%` }} />
                </div>
                <span className="w-8 text-right">{d.avg_confidence}</span>
              </div>
            ))}
            {confidenceTrend.length === 0 && <div className="text-sm text-muted-foreground">No data yet</div>}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Failure Type Distribution</h3>
          <div className="space-y-3">
            {failureTypes.map((ft, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm capitalize">{(ft.type || "unknown").replace(/_/g, " ")}</span>
                <span className="px-2 py-1 bg-muted rounded text-xs font-mono">{ft.count}</span>
              </div>
            ))}
            {failureTypes.length === 0 && <div className="text-sm text-muted-foreground">No data yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
