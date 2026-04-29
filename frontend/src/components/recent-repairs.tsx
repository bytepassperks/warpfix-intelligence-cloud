"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wrench, ExternalLink } from "lucide-react";
import { Badge, ConfidenceBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton";
import { API_URL, formatRelativeTime } from "@/lib/utils";

interface Repair {
  id: string;
  status: string;
  confidence_score: number;
  sandbox_passed: boolean;
  pr_url: string | null;
  engine_used: string;
  created_at: string;
  repo_name: string;
  error_message: string;
}

export function RecentRepairs() {
  const [repairs, setRepairs] = useState<Repair[] | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/repairs`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => setRepairs(data.repairs || []))
      .catch(() => {
        fetch(`${API_URL}/api/dashboard/public-stats`)
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((data) => {
            const mapped = (data.recent_repairs || []).map((r: Record<string, unknown>) => ({
              id: r.id,
              status: r.sandbox_passed ? "completed" : "failed",
              confidence_score: (r.confidence_score as number) || 0,
              sandbox_passed: r.sandbox_passed,
              pr_url: r.pr_url,
              engine_used: (r.error_classification as string) || "unknown",
              created_at: r.created_at as string,
              repo_name: (r.repo_name as string) || (r.repo_full_name as string) || "-",
              error_message: (r.error_summary as string) || (r.error_message as string) || "-",
            }));
            setRepairs(mapped);
          })
          .catch(() => setRepairs([]));
      });
  }, []);

  if (repairs === null) return <SkeletonTable rows={4} />;

  if (repairs.length === 0) {
    return (
      <EmptyState
        icon={Wrench}
        title="No repairs yet"
        description="Repairs appear when CI failures are detected on repos with WarpFix installed. Run /fix-ci to get started."
        action={{ label: "Connect Repository", href: "/dashboard/repositories" }}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-lg border border-[var(--border-default)] overflow-hidden"
    >
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
            <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Repository</th>
            <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Error</th>
            <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Type</th>
            <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Confidence</th>
            <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Status</th>
            <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">PR</th>
            <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Time</th>
          </tr>
        </thead>
        <tbody>
          {repairs.map((repair) => (
            <tr
              key={repair.id}
              className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <td className="py-3 px-5 font-mono text-xs">{repair.repo_name}</td>
              <td className="py-3 px-5 max-w-[240px] truncate text-[var(--text-secondary)]">
                {repair.error_message}
              </td>
              <td className="py-3 px-5">
                <Badge>{repair.engine_used}</Badge>
              </td>
              <td className="py-3 px-5">
                <ConfidenceBadge score={repair.confidence_score} />
              </td>
              <td className="py-3 px-5">
                <Badge variant={repair.status === "completed" ? "success" : "error"}>
                  {repair.status}
                </Badge>
              </td>
              <td className="py-3 px-5">
                {repair.pr_url ? (
                  <a
                    href={repair.pr_url}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1 text-[var(--brand)] hover:underline"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[var(--text-tertiary)]">—</span>
                )}
              </td>
              <td className="py-3 px-5 text-[var(--text-tertiary)]">
                {formatRelativeTime(repair.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
