"use client";

import { useState, useEffect } from "react";

interface Metric {
  metric_type: string;
  metric_value: Record<string, unknown>;
  recorded_at: string;
}



export function TelemetryView() {
  const [metrics, setMetrics] = useState<Metric[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/dashboard/telemetry`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then((data) => setMetrics(data.metrics || []))
      .catch(() => setMetrics([]));
  }, []);

  const repairMetrics = metrics.filter((m) => m.metric_type === "repair_completed");
  const avgConfidence = repairMetrics.length > 0
    ? Math.round(repairMetrics.reduce((sum, m) => sum + ((m.metric_value.confidence as number) || 0), 0) / repairMetrics.length)
    : 0;
  const avgDuration = repairMetrics.length > 0
    ? Math.round(repairMetrics.reduce((sum, m) => sum + ((m.metric_value.duration_ms as number) || 0), 0) / repairMetrics.length / 1000)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm text-muted-foreground mb-1">Avg Confidence</div>
          <div className="text-2xl font-bold">{avgConfidence}/100</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm text-muted-foreground mb-1">Avg Duration</div>
          <div className="text-2xl font-bold">{avgDuration}s</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm text-muted-foreground mb-1">Total Events</div>
          <div className="text-2xl font-bold">{metrics.length}</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Event Log</h3>
        </div>
        <div className="divide-y divide-border/50">
          {metrics.map((metric, i) => (
            <div key={i} className="p-4 flex items-start gap-4 hover:bg-muted/30 text-sm">
              <div className="shrink-0">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs ${
                    metric.metric_type === "repair_completed"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {metric.metric_type}
                </span>
              </div>
              <div className="flex-1 font-mono text-xs text-muted-foreground">
                {JSON.stringify(metric.metric_value, null, 0)}
              </div>
              <div className="text-xs text-muted-foreground shrink-0">
                {new Date(metric.recorded_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
