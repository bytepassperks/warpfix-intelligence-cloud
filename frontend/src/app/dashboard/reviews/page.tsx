"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquareText, ExternalLink } from "lucide-react";
import { Badge, RiskBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard, SkeletonTable } from "@/components/ui/skeleton";
import { API_URL, formatRelativeTime } from "@/lib/utils";
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

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [stats, setStats] = useState({
    total_reviews: 0,
    issue_breakdown: { critical: 0, warnings: 0, nitpicks: 0, praise: 0 },
  });
  const [gated, setGated] = useState<{feature: string; currentPlan: string; requiredPlan: string} | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/reviews`, { credentials: "include" })
      .then(async (r) => { if (r.status === 403) { const b = await r.json(); if (b.feature) { setGated({ feature: b.feature, currentPlan: b.current_plan || "free", requiredPlan: b.required_plan || "pro" }); return null; } } return r.ok ? r.json() : null; })
      .then((d) => {
        if (d) {
          const reviews = d.reviews || d.recent_reviews || [];
          setReviews(reviews);
          setStats({
            total_reviews: d.total_reviews || reviews.length,
            issue_breakdown: d.issue_breakdown || stats.issue_breakdown,
          });
        } else {
          setReviews([]);
        }
      })
      .catch(() => setReviews([]));
  }, []);

  const statCards = [
    { label: "Total Reviews", value: stats.total_reviews, color: "" },
    { label: "Critical", value: stats.issue_breakdown.critical, color: "text-red-500" },
    { label: "Warnings", value: stats.issue_breakdown.warnings, color: "text-amber-500" },
    { label: "Nitpicks", value: stats.issue_breakdown.nitpicks, color: "text-blue-500" },
  ];

  if (gated) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <UpgradeGate feature={gated.feature} requiredPlan={gated.requiredPlan} currentPlan={gated.currentPlan} />
      </div>
    );
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-xl font-semibold">PR Reviews</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
          Automated code reviews across your repositories
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {reviews === null
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-lg border border-[var(--border-default)] p-5"
              >
                <div className="text-[13px] text-[var(--text-secondary)]">{c.label}</div>
                <div className={`text-2xl font-bold mt-1 ${c.color}`}>{c.value}</div>
              </motion.div>
            ))}
      </div>

      {reviews === null ? (
        <SkeletonTable rows={3} />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="No reviews yet"
          description="Reviews appear automatically when PRs are opened on repos with WarpFix installed."
          action={{ label: "Connect Repository", href: "/dashboard/repositories" }}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-lg border border-[var(--border-default)] overflow-hidden"
        >
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
                <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">PR</th>
                <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Repository</th>
                <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Risk</th>
                <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Effort</th>
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
                  <td className="py-3 px-5"><RiskBadge level={r.risk_level || "low"} /></td>
                  <td className="py-3 px-5">
                    <span className="font-medium">{r.review_effort_level}</span>
                    <span className="text-[var(--text-tertiary)]">/5</span>
                  </td>
                  <td className="py-3 px-5">{r.inline_comments_count}</td>
                  <td className="py-3 px-5 text-[var(--text-tertiary)]">{formatRelativeTime(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
