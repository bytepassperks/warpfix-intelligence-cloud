"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://warpfix-api.onrender.com";

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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({
    total_reviews: 0,
    issue_breakdown: { critical: 0, warnings: 0, nitpicks: 0, praise: 0 },
  });

  useEffect(() => {
    fetch(`${API}/api/reviews/public-stats`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setReviews(d.recent_reviews || []);
          setStats({
            total_reviews: d.total_reviews || 0,
            issue_breakdown: d.issue_breakdown || stats.issue_breakdown,
          });
        }
      })
      .catch(() => {});
  }, []);

  const riskColor = (level: string) => {
    switch (level) {
      case "critical": return "bg-red-500/10 text-red-500";
      case "high": return "bg-orange-500/10 text-orange-500";
      case "medium": return "bg-yellow-500/10 text-yellow-500";
      default: return "bg-green-500/10 text-green-500";
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">PR Reviews</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Reviews" value={stats.total_reviews} />
        <StatCard label="Critical Issues" value={stats.issue_breakdown.critical} color="text-red-500" />
        <StatCard label="Warnings" value={stats.issue_breakdown.warnings} color="text-yellow-500" />
        <StatCard label="Nitpicks" value={stats.issue_breakdown.nitpicks} color="text-blue-500" />
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left">PR</th>
              <th className="px-4 py-3 text-left">Repository</th>
              <th className="px-4 py-3 text-left">Risk</th>
              <th className="px-4 py-3 text-left">Effort</th>
              <th className="px-4 py-3 text-left">Comments</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3">
                  <a href={r.pr_url} target="_blank" rel="noopener" className="text-primary hover:underline">
                    #{r.pr_number}
                  </a>
                  <div className="text-xs text-muted-foreground truncate max-w-xs">{r.pr_title}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{r.repo_name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${riskColor(r.risk_level)}`}>
                    {r.risk_level || "low"}
                  </span>
                </td>
                <td className="px-4 py-3">{r.review_effort_level}/5</td>
                <td className="px-4 py-3">{r.inline_comments_count}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No reviews yet. Reviews appear when PRs are opened on repos with WarpFix installed.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${color || ""}`}>{value}</div>
    </div>
  );
}
