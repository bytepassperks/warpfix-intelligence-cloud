"use client";

import { motion } from "framer-motion";
import { BookOpen, Play, Settings, AlertTriangle, CheckCircle2, Clock, Zap, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { API_URL, formatRelativeTime } from "@/lib/utils";

interface Playbook {
  id: string;
  trigger: string;
  name: string;
  confidence: number;
  runs: number;
  last_run: string | null;
  source: string;
}

interface RunbookData {
  overview: { totalPlaybooks: number; totalRuns: number; eventsProcessed: number };
  playbooks: Playbook[];
  recentActivity: { id: string; rule: string; category: string; created_at: string }[];
}

export default function RunbookPage() {
  const [data, setData] = useState<RunbookData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/intelligence/runbook`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const overview = data?.overview || { totalPlaybooks: 0, totalRuns: 0, eventsProcessed: 0 };
  const playbooks = data?.playbooks || [];
  const activity = data?.recentActivity || [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Runbook Agent</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Programmable automation playbooks that execute multi-step repair workflows when CI events match defined triggers.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Playbooks", value: overview.totalPlaybooks.toString(), icon: BookOpen, color: "text-indigo-600" },
          { label: "Total Runs", value: overview.totalRuns.toLocaleString(), icon: Play, color: "text-green-600" },
          { label: "Events Processed", value: overview.eventsProcessed.toLocaleString(), icon: Zap, color: "text-amber-600" },
        ].map((card) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-[var(--border-default)] p-4">
            <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
            <div className="text-xl font-bold text-[var(--text-primary)]">{card.value}</div>
            <div className="text-[12px] text-[var(--text-tertiary)]">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {playbooks.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-tertiary)] text-[13px]">
          No playbooks configured yet. Playbooks are learned automatically from your CI patterns and repair preferences.
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {playbooks.map((pb) => (
            <motion.div key={pb.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-[var(--border-default)] p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span className="text-[14px] font-semibold">{pb.name}</span>
                </div>
                <span className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                  active
                </span>
              </div>
              <div className="flex items-center gap-4 text-[12px] text-[var(--text-tertiary)]">
                <span>Trigger: {pb.trigger}</span>
                <span>{pb.runs} runs</span>
                <span>Confidence: {pb.confidence}%</span>
                {pb.last_run && <span>Last run: {formatRelativeTime(pb.last_run)}</span>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {activity.length > 0 && (
        <div>
          <h2 className="text-[15px] font-semibold mb-3">Recent Activity</h2>
          <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
            <div className="divide-y divide-[var(--border-default)]">
              {activity.map((a) => (
                <div key={a.id} className="px-5 py-3 flex items-center justify-between text-[12px]">
                  <div>
                    <span className="font-medium text-[var(--text-primary)]">{a.rule}</span>
                    <span className="ml-2 text-[var(--text-tertiary)]">{a.category}</span>
                  </div>
                  <span className="text-[var(--text-tertiary)]">{formatRelativeTime(a.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
