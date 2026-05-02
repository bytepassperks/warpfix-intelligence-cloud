"use client";

import { motion } from "framer-motion";
import { PlayCircle, CheckCircle2, XCircle, Cpu, ArrowRight, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { API_URL, formatRelativeTime } from "@/lib/utils";

interface SimRepair {
  id: string;
  error_message: string;
  patch_summary: string | null;
  confidence_score: number | null;
  sandbox_passed: boolean;
  engine_used: string | null;
  status: string;
  created_at: string;
  repo_name: string | null;
}

interface SimData {
  overview: { totalSimulations: number; passRate: number };
  repairs: SimRepair[];
}

export default function SimulationPage() {
  const [data, setData] = useState<SimData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/intelligence/simulation`, { credentials: "include" })
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

  const overview = data?.overview || { totalSimulations: 0, passRate: 0 };
  const repairs = data?.repairs || [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Simulation Mode</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Preview repairs in a sandboxed environment before applying. WarpFix runs your tests against the proposed patch to validate it works.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: "Simulations Run", value: overview.totalSimulations.toString(), icon: PlayCircle, color: "text-indigo-600" },
          { label: "Pass Rate", value: `${overview.passRate}%`, icon: CheckCircle2, color: "text-green-600" },
        ].map((card) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-[var(--border-default)] p-4">
            <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
            <div className="text-xl font-bold text-[var(--text-primary)]">{card.value}</div>
            <div className="text-[12px] text-[var(--text-tertiary)]">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {repairs.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-tertiary)] text-[13px]">
          No simulations yet. Repairs are simulated automatically when CI failures are detected on your repos.
        </div>
      ) : (
        <div className="space-y-3">
          {repairs.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-white rounded-xl border border-[var(--border-default)] p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {r.sandbox_passed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-[14px] font-semibold text-[var(--text-primary)] truncate max-w-[500px]">
                    {r.error_message?.substring(0, 80) || "Repair simulation"}
                  </span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  r.sandbox_passed ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {r.sandbox_passed ? "Passed" : "Failed"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[12px] text-[var(--text-tertiary)]">
                {r.repo_name && <span>{r.repo_name}</span>}
                {r.engine_used && <span className="flex items-center gap-1"><Cpu className="w-3 h-3" />{r.engine_used}</span>}
                {r.confidence_score && <span>Confidence: {r.confidence_score}%</span>}
                <span>{formatRelativeTime(r.created_at)}</span>
              </div>
              {r.patch_summary && (
                <p className="mt-2 text-[12px] text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-lg p-3">
                  {r.patch_summary}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
