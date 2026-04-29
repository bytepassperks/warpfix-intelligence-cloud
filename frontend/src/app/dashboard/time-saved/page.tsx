"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://warpfix-api.onrender.com";

export default function TimeSavedPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`${API}/api/analytics/time-saved`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {});
  }, []);

  const reviewTime = (data?.review_time_saved || {}) as Record<string, number>;
  const repairTime = (data?.repair_time_saved || {}) as Record<string, number>;
  const totalHours = (data?.total_hours_saved || 0) as number;
  const totalMinutes = (data?.total_minutes_saved || 0) as number;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Time Saved</h1>

      <div className="bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 rounded-xl p-8 mb-8">
        <div className="text-sm text-muted-foreground">Total Time Saved (30 days)</div>
        <div className="text-5xl font-bold text-primary mt-2">{totalHours}h</div>
        <div className="text-sm text-muted-foreground mt-1">{totalMinutes} minutes</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Review Automation</h3>
          <div className="space-y-3">
            <StatRow label="PRs Auto-Reviewed" value={reviewTime.reviews_automated || 0} />
            <StatRow label="Review Minutes Saved" value={reviewTime.minutes_saved || 0} />
            <StatRow label="Avg Minutes/Review" value={reviewTime.avg_minutes_per_review || 0} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Repair Automation</h3>
          <div className="space-y-3">
            <StatRow label="CI Repairs Automated" value={repairTime.repairs_automated || 0} />
            <StatRow label="Successful Repairs" value={repairTime.successful_repairs || 0} />
            <StatRow label="Avg Repair Time (sec)" value={repairTime.avg_repair_seconds || 0} />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">How Time is Calculated</h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Each automated PR review saves the estimated review time (based on PR complexity).</p>
          <p>Each successful CI repair saves ~30 minutes of manual debugging and fixing.</p>
          <p>Fingerprint-cached repairs save additional time by reusing proven fixes instantly.</p>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-lg font-bold">{typeof value === "number" ? value.toLocaleString() : value}</span>
    </div>
  );
}
