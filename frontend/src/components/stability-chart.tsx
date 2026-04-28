"use client";

import { useState, useEffect } from "react";

interface StabilityData {
  stability_score: number;
  ci_failure_trend: Array<{ day: string; failures: number }>;
  repair_frequency: Array<{ day: string; repairs: number }>;
  open_dependency_alerts: number;
}

const DEMO_DATA: StabilityData = {
  stability_score: 76,
  ci_failure_trend: Array.from({ length: 14 }, (_, i) => ({
    day: new Date(Date.now() - (13 - i) * 86400000).toISOString().split("T")[0],
    failures: Math.floor(Math.random() * 5),
  })),
  repair_frequency: Array.from({ length: 14 }, (_, i) => ({
    day: new Date(Date.now() - (13 - i) * 86400000).toISOString().split("T")[0],
    repairs: Math.floor(Math.random() * 4),
  })),
  open_dependency_alerts: 3,
};

export function StabilityChart() {
  const [data, setData] = useState<StabilityData | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/dashboard/stability`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData(DEMO_DATA));
  }, []);

  if (!data) {
    return <div className="animate-pulse bg-card border border-border rounded-xl h-64" />;
  }

  const maxFailures = Math.max(...data.ci_failure_trend.map((d) => d.failures), 1);

  return (
    <div className="space-y-6">
      {/* Score + Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-6 col-span-1">
          <div className="text-sm text-muted-foreground mb-2">Stability Score</div>
          <div className="text-5xl font-bold">
            <span
              className={
                data.stability_score >= 70
                  ? "text-success"
                  : data.stability_score >= 40
                  ? "text-warning"
                  : "text-danger"
              }
            >
              {data.stability_score}
            </span>
            <span className="text-lg text-muted-foreground">/100</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 col-span-1">
          <div className="text-sm text-muted-foreground mb-2">Open Dependency Alerts</div>
          <div className="text-5xl font-bold text-warning">{data.open_dependency_alerts}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 col-span-1">
          <div className="text-sm text-muted-foreground mb-2">Total Failures (30d)</div>
          <div className="text-5xl font-bold text-danger">
            {data.ci_failure_trend.reduce((sum, d) => sum + d.failures, 0)}
          </div>
        </div>
      </div>

      {/* Failure Trend Bar Chart */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">CI Failures (Last 14 Days)</h3>
        <div className="flex items-end gap-2 h-40">
          {data.ci_failure_trend.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-danger/60 rounded-t transition-all"
                style={{ height: `${(d.failures / maxFailures) * 100}%`, minHeight: d.failures > 0 ? "4px" : "0" }}
              />
              <span className="text-[10px] text-muted-foreground">
                {d.day.slice(5)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Repair Frequency */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Repair Activity (Last 14 Days)</h3>
        <div className="flex items-end gap-2 h-40">
          {data.repair_frequency.map((d, i) => {
            const maxRepairs = Math.max(...data.repair_frequency.map((r) => r.repairs), 1);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-primary/60 rounded-t transition-all"
                  style={{ height: `${(d.repairs / maxRepairs) * 100}%`, minHeight: d.repairs > 0 ? "4px" : "0" }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {d.day.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
