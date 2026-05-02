"use client";

import { motion } from "framer-motion";
import { MessageSquare, Eye, Shield, Zap, CheckCircle2, GitPullRequest, Loader2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { API_URL, formatRelativeTime } from "@/lib/utils";
import { Badge, RiskBadge } from "@/components/ui/badge";
import { UpgradeGate } from "@/components/ui/upgrade-gate";

interface Review {
  id: string;
  pr_number: number;
  pr_title: string;
  pr_url: string;
  summary: string;
  risk_level: string;
  review_effort_level: number;
  inline_comments_count: number;
  review_data: Record<string, unknown>;
  created_at: string;
  repo_name: string;
}

interface PRReviewerData {
  overview: {
    totalReviews: number;
    totalIssues: number;
    autoFixed: number;
    issueBreakdown: { critical: number; warnings: number; nitpicks: number };
  };
  reviews: Review[];
}

export default function PRReviewerPage() {
  const [data, setData] = useState<PRReviewerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [gated, setGated] = useState<{feature: string; currentPlan: string; requiredPlan: string} | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/intelligence/pr-reviewer`, { credentials: "include" })
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

  const overview = data?.overview || { totalReviews: 0, totalIssues: 0, autoFixed: 0, issueBreakdown: { critical: 0, warnings: 0, nitpicks: 0 } };
  const reviews = data?.reviews || [];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">PR Reviewer</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Automated code review with static analysis, security scanning, and best-practice enforcement.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "PRs Reviewed", value: overview.totalReviews.toString(), icon: GitPullRequest, color: "text-indigo-600" },
          { label: "Issues Found", value: overview.totalIssues.toLocaleString(), icon: Eye, color: "text-amber-600" },
          { label: "Auto-Fixed", value: overview.autoFixed.toLocaleString(), icon: CheckCircle2, color: "text-green-600" },
          { label: "Critical", value: overview.issueBreakdown.critical.toString(), icon: Shield, color: "text-red-600" },
        ].map((card) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-[var(--border-default)] p-4">
            <card.icon className={`w-5 h-5 ${card.color} mb-2`} />
            <div className="text-xl font-bold text-[var(--text-primary)]">{card.value}</div>
            <div className="text-[12px] text-[var(--text-tertiary)]">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-tertiary)] text-[13px]">
          No PR reviews yet. Reviews are generated automatically when PRs are opened on repos with WarpFix installed.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
                <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">PR</th>
                <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Repository</th>
                <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Risk</th>
                <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Comments</th>
                <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Date</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors">
                  <td className="py-3 px-5">
                    <a href={r.pr_url} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-[var(--brand)] hover:underline">
                      #{r.pr_number} <ExternalLink className="w-3 h-3" />
                    </a>
                    <div className="text-xs text-[var(--text-tertiary)] truncate max-w-[200px]">{r.pr_title}</div>
                  </td>
                  <td className="py-3 px-5 text-[var(--text-secondary)]">{r.repo_name}</td>
                  <td className="py-3 px-5"><RiskBadge level={r.risk_level} /></td>
                  <td className="py-3 px-5 text-[var(--text-secondary)]">{r.inline_comments_count}</td>
                  <td className="py-3 px-5 text-[var(--text-tertiary)]">{formatRelativeTime(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
