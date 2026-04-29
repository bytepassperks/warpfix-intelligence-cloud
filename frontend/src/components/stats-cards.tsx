"use client";

import { useState, useEffect } from "react";

interface Stats {
  total_repairs: number;
  successful_repairs: number;
  success_rate: number;
  unique_fingerprints: number;
  fingerprint_reuse_count: number;
  repairs_this_month: number;
  plan: string;
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    fetch(`${apiUrl}/api/dashboard/stats`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then((data) => setStats(data.stats))
      .catch(() => {
        // Fallback to public stats endpoint (includes webhook-triggered repairs)
        fetch(`${apiUrl}/api/dashboard/public-stats`)
          .then((res) => res.ok ? res.json() : Promise.reject())
          .then((data) => setStats(data.stats))
          .catch(() => setStats({
            total_repairs: 0, successful_repairs: 0, success_rate: 0,
            unique_fingerprints: 0, fingerprint_reuse_count: 0,
            repairs_this_month: 0, plan: "free",
          }));
      });
  }, []);

  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse h-28" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: "Total Repairs", value: stats.total_repairs, sub: `${stats.repairs_this_month} this month` },
    { label: "Success Rate", value: `${stats.success_rate}%`, sub: `${stats.successful_repairs} succeeded` },
    { label: "Fingerprints", value: stats.unique_fingerprints, sub: `${stats.fingerprint_reuse_count ?? 0} reused` },
    { label: "Current Plan", value: stats.plan.toUpperCase(), sub: stats.plan === "free" ? `${stats.repairs_this_month}/3 used` : "Unlimited" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-5">
          <div className="text-sm text-muted-foreground mb-1">{card.label}</div>
          <div className="text-2xl font-bold">{card.value}</div>
          <div className="text-xs text-muted-foreground mt-1">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}
