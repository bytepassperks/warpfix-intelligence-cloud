"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Radar, AlertCircle, TrendingDown, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import { API_URL } from "@/lib/utils";

export default function DependencyRadarPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/dashboard/stability`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData({}));
  }, []);

  const score = (data?.stability_score ?? 0) as number;
  const alerts = (data?.open_dependency_alerts ?? 0) as number;
  const trend = (data?.ci_failure_trend || []) as Array<{ day: string; failures: number }>;
  const totalFailures = trend.reduce((sum, d) => sum + d.failures, 0);
  const maxFailures = Math.max(...trend.map((d) => d.failures), 1);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-xl font-semibold">Dependency Radar</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
          Monitor dependency health and CI stability
        </p>
      </motion.div>

      {data === null ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-[var(--border-default)] p-6"
            >
              <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)] mb-2">
                <Shield className="w-4 h-4" />
                Stability Score
              </div>
              <div className="text-4xl font-bold">
                <span className={score >= 70 ? "text-emerald-600" : score >= 40 ? "text-amber-500" : "text-red-500"}>
                  {score}
                </span>
                <span className="text-lg text-[var(--text-tertiary)]">/100</span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-lg border border-[var(--border-default)] p-6"
            >
              <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)] mb-2">
                <AlertCircle className="w-4 h-4" />
                Open Alerts
              </div>
              <div className="text-4xl font-bold text-amber-500">{alerts}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-lg border border-[var(--border-default)] p-6"
            >
              <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)] mb-2">
                <TrendingDown className="w-4 h-4" />
                Failures (14d)
              </div>
              <div className="text-4xl font-bold text-red-500">{totalFailures}</div>
            </motion.div>
          </div>

          {trend.length > 0 ? (
            <div className="bg-white rounded-lg border border-[var(--border-default)] p-6">
              <h3 className="font-semibold text-[15px] mb-4">CI Failure Trend (14 days)</h3>
              <div className="flex items-end gap-2 h-40">
                {trend.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-[10px] text-[var(--text-tertiary)]">{d.failures || ""}</div>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.failures / maxFailures) * 100}%` }}
                      transition={{ delay: i * 0.03, duration: 0.4 }}
                      className="w-full bg-red-400/60 rounded-t"
                      style={{ minHeight: d.failures > 0 ? 4 : 0 }}
                    />
                    <span className="text-[10px] text-[var(--text-tertiary)]">{d.day.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Radar}
              title="No CI data yet"
              description="Failure trends appear after WarpFix monitors your CI pipeline for a few days."
            />
          )}
        </>
      )}
    </div>
  );
}
