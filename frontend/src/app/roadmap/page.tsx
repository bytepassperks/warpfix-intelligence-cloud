import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Roadmap",
  description: "See what's live, in beta, and coming soon to the WarpFix platform.",
};

type Status = "live" | "beta" | "coming-soon";

interface RoadmapItem {
  title: string;
  description: string;
  status: Status;
  quarter?: string;
}

const statusConfig: Record<Status, { label: string; color: string; bg: string }> = {
  live: { label: "Live", color: "text-green-700", bg: "bg-green-50 border-green-200" },
  beta: { label: "Beta", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  "coming-soon": { label: "Coming Soon", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
};

const SECTIONS: { title: string; items: RoadmapItem[] }[] = [
  {
    title: "CI Repair Engine",
    items: [
      { title: "Multi-Agent Repair Pipeline", description: "6-agent system: parser → classifier → patcher → validator → scorer → shipper", status: "live" },
      { title: "Fingerprint Learning", description: "Hash-based error pattern matching with cross-org sharing and confidence scores", status: "live" },
      { title: "Sandbox Validation", description: "Isolated Docker containers for patch testing before PR creation", status: "live" },
      { title: "Predictive CI Failure", description: "Analyze PR diffs to warn about likely failures before CI runs", status: "beta" },
      { title: "Auto-Retry with Variants", description: "When first patch fails validation, generate and test alternative approaches", status: "coming-soon", quarter: "Q3 2026" },
    ],
  },
  {
    title: "Code Review Intelligence",
    items: [
      { title: "PR Review Summaries", description: "Auto-generated PR summaries with effort estimates and risk scoring", status: "live" },
      { title: "Inline Review Comments", description: "Severity-tagged inline comments with suggested fixes", status: "live" },
      { title: "Mermaid Architecture Diagrams", description: "Auto-generated flow diagrams showing code change impact", status: "live" },
      { title: "Chat Agent (@warpfix)", description: "Interactive PR assistant for security analysis, test suggestions, refactoring", status: "live" },
      { title: "Multi-PR Impact Analysis", description: "Cross-PR dependency detection and conflict warnings", status: "coming-soon", quarter: "Q3 2026" },
    ],
  },
  {
    title: "Security & Quality",
    items: [
      { title: "Security Auto-Patching", description: "CVE and OWASP vulnerability fixes in CI pipeline", status: "live" },
      { title: "Dead Code Detection", description: "Identify and flag unused code across the codebase", status: "live" },
      { title: "Quality Gates (.warpfix.yaml)", description: "Custom rules and thresholds for code quality enforcement", status: "live" },
      { title: "Static Tool Auto-Fixes", description: "Automated ruff/eslint/prettier fixes — zero LLM cost", status: "beta" },
      { title: "License Compliance Scanner", description: "Detect incompatible open-source licenses in dependencies", status: "coming-soon", quarter: "Q4 2026" },
    ],
  },
  {
    title: "Analytics & Insights",
    items: [
      { title: "Repair Dashboard", description: "Track repairs, success rates, and time savings", status: "live" },
      { title: "Failure Fingerprint Analytics", description: "Top failing patterns, frequency trends, and resolution rates", status: "beta" },
      { title: "Flaky Test Detection", description: "CI history heuristics to identify non-deterministic test failures", status: "beta" },
      { title: "Dependency Hygiene Alerts", description: "Outdated, deprecated, and breaking package notifications", status: "beta" },
      { title: "Team Productivity Metrics", description: "CI health score, MTTR tracking, developer time savings", status: "coming-soon", quarter: "Q3 2026" },
    ],
  },
  {
    title: "Developer Experience",
    items: [
      { title: "GitHub App Installation", description: "One-click install, minimal permissions, instant activation", status: "live" },
      { title: "Simulation / Read-Only Mode", description: "Comment-only mode — patches suggested without opening PRs", status: "beta" },
      { title: "Autopsy Reports", description: "Rich failure analysis with root cause, affected files, and historical context", status: "beta" },
      { title: "CLI / Local Dry-Run", description: "Run WarpFix analysis locally without GitHub — prints proposed patches", status: "coming-soon", quarter: "Q3 2026" },
      { title: "VS Code Extension", description: "In-editor failure analysis and one-click repair from your IDE", status: "coming-soon", quarter: "Q4 2026" },
    ],
  },
];

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[var(--border-default)]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-warpfix.png" alt="WarpFix" width={28} height={28} />
            <span className="font-semibold text-[15px] text-[var(--text-primary)]">WarpFix</span>
          </Link>
          <Link href="/" className="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Roadmap</h1>
        <p className="text-[var(--text-tertiary)] text-sm mb-4">
          What&apos;s live, what&apos;s in beta, and what&apos;s coming next.
        </p>

        {/* Status legend */}
        <div className="flex gap-4 mb-12">
          {(Object.entries(statusConfig) as [Status, typeof statusConfig.live][]).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-12">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">{section.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {section.items.map((item) => {
                  const cfg = statusConfig[item.status];
                  return (
                    <div
                      key={item.title}
                      className="bg-white rounded-xl border border-[var(--border-default)] p-4 hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{item.title}</h3>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-[13px] text-[var(--text-tertiary)] leading-relaxed">{item.description}</p>
                      {item.quarter && (
                        <p className="text-[11px] text-[var(--text-tertiary)] mt-2">Expected: {item.quarter}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 bg-indigo-50 rounded-xl p-6 border border-indigo-100 text-center">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Have a feature request?</h2>
          <p className="text-[14px] text-[var(--text-secondary)]">
            We&apos;d love to hear from you. Email{" "}
            <a href="mailto:support@warpfix.org" className="text-indigo-600 hover:underline font-medium">support@warpfix.org</a>{" "}
            or open a discussion on{" "}
            <a href="https://github.com/bytepassperks/warpfix-intelligence-cloud" className="text-indigo-600 hover:underline font-medium" target="_blank" rel="noopener noreferrer">GitHub</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
