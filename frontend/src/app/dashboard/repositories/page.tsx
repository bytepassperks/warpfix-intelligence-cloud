"use client";

import { motion } from "framer-motion";
import { FolderGit2, GitBranch, Wrench, ExternalLink } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { API_URL } from "@/lib/utils";

interface Repo {
  full_name: string;
  total_repairs: number;
  success_rate: number;
  last_repair_at: string | null;
}

export default function RepositoriesPage() {
  const [repos, setRepos] = useState<Repo[] | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/dashboard/stats`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.recent_repairs?.length) {
          const repoMap = new Map<string, Repo>();
          for (const r of data.recent_repairs) {
            const name = (r.repo_name || r.repo_full_name || "unknown") as string;
            const existing = repoMap.get(name);
            if (existing) {
              existing.total_repairs++;
              if (r.sandbox_passed) existing.success_rate++;
            } else {
              repoMap.set(name, {
                full_name: name,
                total_repairs: 1,
                success_rate: r.sandbox_passed ? 1 : 0,
                last_repair_at: r.created_at as string,
              });
            }
          }
          const repos = Array.from(repoMap.values()).map((r) => ({
            ...r,
            success_rate: Math.round((r.success_rate / r.total_repairs) * 100),
          }));
          setRepos(repos);
        } else {
          setRepos([]);
        }
      })
      .catch(() => setRepos([]));
  }, []);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-xl font-semibold">Repositories</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
          Repos with WarpFix installed
        </p>
      </motion.div>

      {repos === null ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="shimmer rounded-lg h-40" />
          ))}
        </div>
      ) : repos.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title="No repositories connected"
          description="Install the WarpFix GitHub App on a repository to start monitoring CI failures and auto-repairing them."
          action={{
            label: "Install GitHub App",
            href: "https://github.com/apps/warpfix/installations/new",
          }}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repos.map((repo, i) => (
            <motion.div
              key={repo.full_name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group bg-white rounded-lg border border-[var(--border-default)] p-5 hover:shadow-md hover:border-[var(--border-hover)] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center">
                    <GitBranch className="w-4 h-4 text-[var(--text-secondary)]" />
                  </div>
                  <div>
                    <div className="font-medium text-[14px]">{repo.full_name.split("/").pop()}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">{repo.full_name}</div>
                  </div>
                </div>
                <a
                  href={`https://github.com/${repo.full_name}`}
                  target="_blank"
                  rel="noopener"
                  className="p-1.5 rounded text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors opacity-0 group-hover:opacity-100"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-[var(--text-tertiary)] mb-0.5">Repairs</div>
                  <div className="font-semibold flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    {repo.total_repairs}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--text-tertiary)] mb-0.5">Success</div>
                  <Badge variant={repo.success_rate >= 80 ? "success" : repo.success_rate >= 50 ? "warning" : "error"}>
                    {repo.success_rate}%
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
