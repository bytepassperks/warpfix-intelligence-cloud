"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Clock, TrendingUp, Cpu } from "lucide-react";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { API_URL } from "@/lib/utils";

const TABS = [
  { id: "quality", label: "Quality", icon: BarChart3 },
  { id: "time", label: "Time Saved", icon: Clock },
  { id: "trends", label: "Trends", icon: TrendingUp },
  { id: "predictions", label: "Predictions", icon: Cpu },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("quality");
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const endpoint =
      activeTab === "quality" ? "quality"
      : activeTab === "time" ? "time-saved"
      : activeTab === "trends" ? "trends"
      : "predictions";

    fetch(`${API_URL}/api/analytics/${endpoint}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData({}));
  }, [activeTab]);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-xl font-semibold">Analytics</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
          Deep insights into your repair and review activity
        </p>
      </motion.div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 bg-[var(--bg-tertiary)] rounded-lg w-fit mb-8">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setData(null); setActiveTab(tab.id); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                active
                  ? "bg-white shadow-sm text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {data === null ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "quality" && <QualityTab data={data} />}
          {activeTab === "time" && <TimeSavedTab data={data} />}
          {activeTab === "trends" && <TrendsTab data={data} />}
          {activeTab === "predictions" && <PredictionsTab data={data} />}
        </motion.div>
      )}
    </div>
  );
}

function QualityTab({ data }: { data: Record<string, unknown> }) {
  const stats = (data?.review_stats || {}) as Record<string, number>;
  const severity = (data?.severity_breakdown || {}) as Record<string, number>;
  const categories = (data?.top_issue_categories || []) as Array<{ category: string; count: string }>;
  const max = Math.max(severity.critical || 0, severity.warnings || 0, severity.nitpicks || 0, 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Reviews (30d)", value: stats.total_reviews || 0 },
          { label: "Avg Effort", value: `${(stats.avg_effort || 0).toFixed(1)}/5` },
          { label: "Critical PRs", value: stats.critical_count || 0, color: "text-red-500" },
          { label: "High Risk PRs", value: stats.high_count || 0, color: "text-amber-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border border-[var(--border-default)] p-5">
            <div className="text-[13px] text-[var(--text-secondary)]">{s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.color || ""}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-[var(--border-default)] p-6">
          <h3 className="font-semibold text-[15px] mb-4">Severity Distribution</h3>
          {[
            { label: "Critical", count: severity.critical || 0, color: "bg-red-500" },
            { label: "Warnings", count: severity.warnings || 0, color: "bg-amber-400" },
            { label: "Nitpicks", count: severity.nitpicks || 0, color: "bg-blue-400" },
          ].map((bar) => (
            <div key={bar.label} className="mb-3">
              <div className="flex justify-between text-[13px] mb-1">
                <span>{bar.label}</span>
                <span className="text-[var(--text-tertiary)]">{bar.count}</span>
              </div>
              <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
                <div
                  className={`${bar.color} h-2 rounded-full transition-all`}
                  style={{ width: `${max > 0 ? (bar.count / max) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg border border-[var(--border-default)] p-6">
          <h3 className="font-semibold text-[15px] mb-4">Top Issue Categories</h3>
          <div className="space-y-2.5">
            {categories.length === 0 ? (
              <p className="text-[13px] text-[var(--text-tertiary)]">No data yet</p>
            ) : (
              categories.map((c, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-[13px]">{c.category || "unknown"}</span>
                  <Badge>{c.count}</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeSavedTab({ data }: { data: Record<string, unknown> }) {
  const total = (data?.total_time_saved_minutes || 0) as number;
  const repairs = (data?.total_repairs || 0) as number;
  const avgTime = (data?.avg_repair_time_seconds || 0) as number;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg border border-[var(--border-default)] p-6 text-center">
        <div className="text-[13px] text-[var(--text-secondary)]">Total Time Saved</div>
        <div className="text-4xl font-bold mt-2 text-[var(--brand)]">{total}m</div>
        <div className="text-xs text-[var(--text-tertiary)] mt-1">across all repairs</div>
      </div>
      <div className="bg-white rounded-lg border border-[var(--border-default)] p-6 text-center">
        <div className="text-[13px] text-[var(--text-secondary)]">Repairs Completed</div>
        <div className="text-4xl font-bold mt-2">{repairs}</div>
      </div>
      <div className="bg-white rounded-lg border border-[var(--border-default)] p-6 text-center">
        <div className="text-[13px] text-[var(--text-secondary)]">Avg Repair Time</div>
        <div className="text-4xl font-bold mt-2 text-emerald-600">{avgTime}s</div>
      </div>
    </div>
  );
}

function TrendsTab({ data }: { data: Record<string, unknown> }) {
  const weekly = (data?.weekly_repairs || []) as Array<{ week: string; count: number }>;

  return (
    <div className="bg-white rounded-lg border border-[var(--border-default)] p-6">
      <h3 className="font-semibold text-[15px] mb-4">Weekly Repair Trend</h3>
      {weekly.length === 0 ? (
        <p className="text-[13px] text-[var(--text-tertiary)]">Not enough data yet</p>
      ) : (
        <div className="flex items-end gap-2 h-40">
          {weekly.map((w, i) => {
            const max = Math.max(...weekly.map((x) => x.count), 1);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs text-[var(--text-tertiary)]">{w.count}</div>
                <div
                  className="w-full bg-[var(--brand)] rounded-t transition-all"
                  style={{
                    height: `${(w.count / max) * 100}%`,
                    minHeight: w.count > 0 ? 4 : 0,
                  }}
                />
                <span className="text-[10px] text-[var(--text-tertiary)]">{w.week}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PredictionsTab({ data }: { data: Record<string, unknown> }) {
  const total = (data?.total_predictions || 0) as number;
  const accuracy = (data?.accuracy_percentage || 0) as number;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-[var(--border-default)] p-6 text-center">
          <div className="text-[13px] text-[var(--text-secondary)]">Total Predictions</div>
          <div className="text-4xl font-bold mt-2">{total}</div>
        </div>
        <div className="bg-white rounded-lg border border-[var(--border-default)] p-6 text-center">
          <div className="text-[13px] text-[var(--text-secondary)]">Accuracy</div>
          <div className="text-4xl font-bold mt-2 text-[var(--brand)]">{accuracy}%</div>
        </div>
        <div className="bg-white rounded-lg border border-[var(--border-default)] p-6 text-center">
          <div className="text-[13px] text-[var(--text-secondary)]">CI Runs Saved</div>
          <div className="text-4xl font-bold mt-2 text-emerald-600">
            {Math.round(total * accuracy * 0.01 * 0.3)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[var(--border-default)] p-6">
        <h3 className="font-semibold text-[15px] mb-3">How Predictions Work</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { step: "Pattern Analysis", desc: "Checks if changed files historically caused CI failures" },
            { step: "Impact Analysis", desc: "Uses codegraph to check blast radius and missing tests" },
            { step: "LLM Analysis", desc: "AI examines the diff for common failure patterns" },
          ].map((s) => (
            <div key={s.step} className="p-4 bg-[var(--bg-secondary)] rounded-lg">
              <div className="font-medium text-[13px] mb-1">{s.step}</div>
              <div className="text-[12px] text-[var(--text-secondary)]">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
