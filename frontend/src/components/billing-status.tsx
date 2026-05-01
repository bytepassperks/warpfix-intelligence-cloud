"use client";

import { useState, useEffect } from "react";

interface Subscription {
  current_plan: string;
  usage: {
    repairs_used: number;
    repairs_limit: number;
  };
}

export function BillingStatus() {
  const [sub, setSub] = useState<Subscription | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/billing/subscription`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then(setSub)
      .catch(() =>
        setSub({
          current_plan: "free",
          usage: { repairs_used: 2, repairs_limit: 3 },
        })
      );
  }, []);

  if (!sub) {
    return <div className="animate-pulse bg-card border border-border rounded-xl h-24" />;
  }

  const usagePercent = sub.usage.repairs_limit === Infinity
    ? 0
    : (sub.usage.repairs_used / sub.usage.repairs_limit) * 100;

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm text-muted-foreground">Current Plan</div>
          <div className="text-xl font-bold">{sub.current_plan.toUpperCase()}</div>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Usage This Month</div>
          <div className="text-xl font-bold">
            {sub.usage.repairs_used}
            <span className="text-muted-foreground text-sm">
              /{sub.usage.repairs_limit === Infinity ? "Unlimited" : sub.usage.repairs_limit}
            </span>
          </div>
        </div>
      </div>
      {sub.usage.repairs_limit !== Infinity && (
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              usagePercent >= 90 ? "bg-danger" : usagePercent >= 60 ? "bg-warning" : "bg-primary"
            }`}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
