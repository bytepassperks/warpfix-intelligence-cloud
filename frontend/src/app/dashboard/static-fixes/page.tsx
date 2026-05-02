"use client";

import { motion } from "framer-motion";
import { Wrench, CheckCircle2, Cpu, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { API_URL, formatRelativeTime } from "@/lib/utils";
import { UpgradeGate } from "@/components/ui/upgrade-gate";

interface EngineStat {
  name: string;
  fixes: string;
  successes: string;
  last_run: string;
}

interface StaticFixesData {
  overview: { totalTools: number; totalFixes: number };
  tools: EngineStat[];
}

export default function StaticFixesPage() {
  const [data, setData] = useState<StaticFixesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [gated, setGated] = useState<{feature: string; currentPlan: string; requiredPlan: string} | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/intelligence/static-fixes`, { credentials: "include" })
      .then(async (r) => { if (r.status === 403) { const b = await r.json(); if (b.feature) { setGated({ feature: b.feature, currentPlan: b.current_plan || "free", requiredPlan: b.required_plan || "pro" }); return null; } } return r.ok ? r.json() : null; })
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

  if (gated) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <UpgradeGate feature={gated.feature} requiredPlan={gated.requiredPlan} currentPlan={gated.currentPlan} />
      </div>
    );
  }

  const overview = data?.overview || { totalTools: 0, totalFixes: 0 };
  const tools = data?.tools || [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Static Auto-Fixes</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Deterministic repair engines that fix CI failures without LLM — regex transforms, AST rewrites, config patches, and dependency resolution.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: "Repair Engines", value: overview.totalTools.toString(), icon: Cpu, color: "text-indigo-600" },
          { label: "Total Fixes", value: overview.totalFixes.toLocaleString(), icon: Wrench, color: "text-green-600" },
        ].map((card) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-[var(--border-default)] p-4">
            <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
            <div className="text-xl font-bold text-[var(--text-primary)]">{card.value}</div>
            <div className="text-[12px] text-[var(--text-tertiary)]">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {tools.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-tertiary)] text-[13px]">
          No repair engines have run yet. Engines activate automatically when CI failures match their patterns.
        </div>
      ) : (
        <div className="space-y-3">
          {tools.map((tool, i) => {
            const successRate = parseInt(tool.fixes) > 0
              ? Math.round((parseInt(tool.successes) / parseInt(tool.fixes)) * 100)
              : 0;
            return (
              <motion.div key={tool.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl border border-[var(--border-default)] p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-600" />
                    <span className="text-[14px] font-semibold text-[var(--text-primary)]">{tool.name}</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    successRate >= 80 ? "bg-green-50 text-green-700 border border-green-200"
                    : successRate >= 50 ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                  }`}>
                    {successRate}% success
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[12px] text-[var(--text-tertiary)]">
                  <span>{tool.fixes} fixes applied</span>
                  <span>{tool.successes} successful</span>
                  <span>Last run: {formatRelativeTime(tool.last_run)}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
