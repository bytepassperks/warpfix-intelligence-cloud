"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wrench, TrendingUp, Fingerprint, CreditCard } from "lucide-react";
import { SkeletonCard } from "@/components/ui/skeleton";
import { API_URL } from "@/lib/utils";

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
    fetch(`${API_URL}/api/dashboard/stats`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => setStats(data.stats))
      .catch(() => {
        fetch(`${API_URL}/api/dashboard/public-stats`)
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((data) => setStats(data.stats))
          .catch(() =>
            setStats({
              total_repairs: 0, successful_repairs: 0, success_rate: 0,
              unique_fingerprints: 0, fingerprint_reuse_count: 0,
              repairs_this_month: 0, plan: "free",
            })
          );
      });
  }, []);

  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Repairs",
      value: stats.total_repairs,
      sub: `${stats.repairs_this_month} this month`,
      icon: Wrench,
      iconColor: "text-[var(--brand)] bg-[var(--brand-muted)]",
    },
    {
      label: "Success Rate",
      value: `${stats.success_rate}%`,
      sub: `${stats.successful_repairs} succeeded`,
      icon: TrendingUp,
      iconColor: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Fingerprints",
      value: stats.unique_fingerprints,
      sub: `${stats.fingerprint_reuse_count ?? 0} reused`,
      icon: Fingerprint,
      iconColor: "text-amber-600 bg-amber-50",
    },
    {
      label: "Current Plan",
      value: stats.plan.toUpperCase(),
      sub: stats.plan === "free" ? `${stats.repairs_this_month}/3 used` : "Unlimited",
      icon: CreditCard,
      iconColor: "text-blue-600 bg-blue-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            className="bg-white rounded-lg border border-[var(--border-default)] p-5 hover:shadow-sm hover:border-[var(--border-hover)] transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[13px] text-[var(--text-secondary)]">{card.label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconColor}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{card.value}</div>
            <div className="text-xs text-[var(--text-tertiary)] mt-1">{card.sub}</div>
          </motion.div>
        );
      })}
    </div>
  );
}
