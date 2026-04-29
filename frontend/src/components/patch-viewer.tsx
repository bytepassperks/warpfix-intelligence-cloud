"use client";

import { motion } from "framer-motion";
import { FileCode, AlertCircle, Check, X, GitPullRequest, Shield, Fingerprint } from "lucide-react";
import { Badge, ConfidenceBadge } from "@/components/ui/badge";

interface PatchViewerProps {
  repair: {
    error_summary: string;
    error_classification: string;
    confidence_score: number;
    sandbox_passed: boolean;
    fingerprint_hash?: string;
    fingerprint_reuses?: number;
    patch_diff?: string;
    pr_url?: string;
    file_path?: string;
  };
}

export function PatchViewer({ repair }: PatchViewerProps) {
  const diff = repair.patch_diff || `--- a/src/lib/auth.ts
+++ b/src/lib/auth.ts
@@ -12,7 +12,7 @@
   const session = await getSession();
-  if (!session.user) {
-    throw new Error("Not authenticated");
+  if (!session?.user) {
+    return null;
   }
   return session.user;`;

  const lines = diff.split("\n");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-4"
    >
      {/* Left: Error Explanation */}
      <div className="bg-white rounded-lg border border-[var(--border-default)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border-default)] flex items-center gap-2 bg-[var(--bg-secondary)]">
          <AlertCircle className="w-4 h-4 text-[var(--error)]" />
          <span className="font-semibold text-[14px]">Error Analysis</span>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <div className="text-xs font-medium text-[var(--text-tertiary)] mb-1">Classification</div>
            <Badge variant="error">{repair.error_classification}</Badge>
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--text-tertiary)] mb-1">Summary</div>
            <p className="text-[13px] text-[var(--text-primary)] leading-relaxed">{repair.error_summary}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-medium text-[var(--text-tertiary)] mb-1">Confidence</div>
              <ConfidenceBadge score={repair.confidence_score} />
            </div>
            <div>
              <div className="text-xs font-medium text-[var(--text-tertiary)] mb-1">Sandbox</div>
              <Badge variant={repair.sandbox_passed ? "success" : "error"}>
                {repair.sandbox_passed ? "Passed" : "Failed"}
              </Badge>
            </div>
          </div>
          {repair.fingerprint_hash && (
            <div>
              <div className="text-xs font-medium text-[var(--text-tertiary)] mb-1">Fingerprint</div>
              <div className="flex items-center gap-2">
                <Fingerprint className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                <code className="text-xs font-mono text-[var(--text-secondary)]">
                  {repair.fingerprint_hash.slice(0, 12)}
                </code>
                {repair.fingerprint_reuses && repair.fingerprint_reuses > 0 && (
                  <Badge variant="brand">{repair.fingerprint_reuses}x reused</Badge>
                )}
              </div>
            </div>
          )}

          {/* Merge Recommendation */}
          <div className="pt-3 border-t border-[var(--border-default)]">
            <div className="text-xs font-medium text-[var(--text-tertiary)] mb-2">Recommendation</div>
            {repair.confidence_score >= 80 && repair.sandbox_passed ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-[13px]">
                <Check className="w-4 h-4" />
                Safe to auto-merge
              </div>
            ) : repair.confidence_score >= 50 ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 text-amber-700 text-[13px]">
                <Shield className="w-4 h-4" />
                Review suggested before merge
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-[13px]">
                <X className="w-4 h-4" />
                Manual review required
              </div>
            )}
          </div>

          {repair.pr_url && (
            <a
              href={repair.pr_url}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2 text-[13px] text-[var(--brand)] hover:underline"
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              View Pull Request
            </a>
          )}
        </div>
      </div>

      {/* Right: Diff Preview */}
      <div className="bg-white rounded-lg border border-[var(--border-default)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border-default)] flex items-center gap-2 bg-[var(--bg-secondary)]">
          <FileCode className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="font-semibold text-[14px]">Patch Preview</span>
          {repair.file_path && (
            <code className="text-xs font-mono text-[var(--text-tertiary)] ml-auto">{repair.file_path}</code>
          )}
        </div>
        <div className="overflow-x-auto">
          <pre className="text-[12px] font-mono leading-6">
            {lines.map((line, i) => {
              let bg = "";
              let textColor = "text-[var(--text-primary)]";
              if (line.startsWith("+") && !line.startsWith("+++")) {
                bg = "bg-emerald-50";
                textColor = "text-emerald-800";
              } else if (line.startsWith("-") && !line.startsWith("---")) {
                bg = "bg-red-50";
                textColor = "text-red-800";
              } else if (line.startsWith("@@")) {
                bg = "bg-blue-50";
                textColor = "text-blue-600";
              } else if (line.startsWith("---") || line.startsWith("+++")) {
                textColor = "text-[var(--text-tertiary)]";
              }
              return (
                <div key={i} className={`px-5 ${bg} ${textColor}`}>
                  <span className="inline-block w-8 text-right mr-3 text-[var(--text-tertiary)] select-none">
                    {i + 1}
                  </span>
                  {line}
                </div>
              );
            })}
          </pre>
        </div>
      </div>
    </motion.div>
  );
}
