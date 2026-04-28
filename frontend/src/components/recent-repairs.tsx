"use client";

import { useState, useEffect } from "react";

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

const DEMO_REPAIRS: Repair[] = [
  {
    id: "1",
    status: "completed",
    confidence_score: 94,
    sandbox_passed: true,
    pr_url: "https://github.com/org/repo/pull/287",
    engine_used: "dependency_error",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    repo_name: "org/frontend-app",
    error_message: 'Cannot find module "@/lib/auth"',
  },
  {
    id: "2",
    status: "completed",
    confidence_score: 78,
    sandbox_passed: true,
    pr_url: "https://github.com/org/repo/pull/285",
    engine_used: "test_failure",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    repo_name: "org/api-service",
    error_message: "Expected 200, received 404",
  },
  {
    id: "3",
    status: "failed",
    confidence_score: 32,
    sandbox_passed: false,
    pr_url: null,
    engine_used: "build_error",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    repo_name: "org/shared-lib",
    error_message: "SyntaxError: Unexpected token",
  },
];

export function RecentRepairs() {
  const [repairs, setRepairs] = useState<Repair[]>([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/repairs`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setRepairs(data.repairs || []))
      .catch(() => setRepairs(DEMO_REPAIRS));
  }, []);

  if (repairs.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
        No repairs yet. Run <code className="text-primary">/fix-ci</code> to get started.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="text-left p-4 font-medium">Repository</th>
            <th className="text-left p-4 font-medium">Error</th>
            <th className="text-left p-4 font-medium">Type</th>
            <th className="text-left p-4 font-medium">Confidence</th>
            <th className="text-left p-4 font-medium">Status</th>
            <th className="text-left p-4 font-medium">PR</th>
          </tr>
        </thead>
        <tbody>
          {repairs.map((repair) => (
            <tr key={repair.id} className="border-b border-border/50 hover:bg-muted/30">
              <td className="p-4 font-mono text-xs">{repair.repo_name}</td>
              <td className="p-4 max-w-[200px] truncate">{repair.error_message}</td>
              <td className="p-4">
                <span className="px-2 py-1 bg-muted rounded text-xs">{repair.engine_used}</span>
              </td>
              <td className="p-4">
                <span
                  className={
                    repair.confidence_score >= 70
                      ? "text-success"
                      : repair.confidence_score >= 40
                      ? "text-warning"
                      : "text-danger"
                  }
                >
                  {repair.confidence_score}/100
                </span>
              </td>
              <td className="p-4">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    repair.status === "completed"
                      ? "bg-success/10 text-success"
                      : "bg-danger/10 text-danger"
                  }`}
                >
                  {repair.status}
                </span>
              </td>
              <td className="p-4">
                {repair.pr_url ? (
                  <a href={repair.pr_url} className="text-primary hover:underline text-xs">
                    View PR
                  </a>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
