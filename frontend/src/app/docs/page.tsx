import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Documentation",
  description: "WarpFix documentation — installation guides, CLI commands, configuration, API reference, and troubleshooting.",
  alternates: { canonical: "https://warpfix.org/docs" },
  openGraph: {
    title: "Documentation | WarpFix",
    description: "WarpFix documentation — installation guides, CLI commands, configuration, API reference, and troubleshooting.",
    url: "https://warpfix.org/docs",
    siteName: "WarpFix",
    type: "website",
  },
};

const SECTIONS = [
  {
    title: "Getting Started",
    items: [
      { title: "Installation", desc: "Install the WarpFix GitHub App on your repositories in under 2 minutes.", icon: "🚀" },
      { title: "Configuration", desc: "Create a .warpfix.yaml file to customize repair behavior, quality gates, and ignored paths.", icon: "⚙" },
      { title: "Your First Repair", desc: "Trigger a CI failure and watch WarpFix analyze, patch, validate, and open a PR automatically.", icon: "⚡" },
    ],
  },
  {
    title: "CLI Commands",
    items: [
      { title: "fix-ci", desc: "Trigger an auto-repair for a failing CI workflow. Usage: @warpfix fix-ci or /fix-ci in PR comments.", icon: "🔧" },
      { title: "fix-tests", desc: "Fix broken test cases. Analyzes test output, identifies root cause, generates targeted patches.", icon: "🧪" },
      { title: "fix-deps", desc: "Resolve dependency conflicts. Detects version mismatches, lockfile issues, and breaking updates.", icon: "📦" },
      { title: "predict-failure", desc: "Analyze PR diffs before CI runs. Warns about likely failures based on historical patterns.", icon: "🔮" },
      { title: "repair-last", desc: "Show the results of the most recent repair — patch details, confidence score, validation status.", icon: "📋" },
    ],
  },
  {
    title: "PR Chat Commands",
    items: [
      { title: "@warpfix explain", desc: "Get a detailed explanation of why a specific code change was made in a repair PR.", icon: "💬" },
      { title: "@warpfix security", desc: "Run a security analysis on the current PR — checks for CVEs, OWASP issues, and unsafe patterns.", icon: "🛡" },
      { title: "@warpfix test", desc: "Generate test cases for new or modified code in the PR.", icon: "✅" },
      { title: "@warpfix refactor", desc: "Get refactoring suggestions for the changed code — cleaner patterns, performance improvements.", icon: "♻" },
      { title: "@warpfix performance", desc: "Analyze performance implications of code changes — algorithmic complexity, memory usage.", icon: "📊" },
    ],
  },
  {
    title: "Configuration Reference",
    items: [
      { title: ".warpfix.yaml", desc: "Define quality gates, ignored paths, auto-merge rules, confidence thresholds, and notification preferences.", icon: "📄" },
      { title: "Quality Gates", desc: "Set minimum confidence scores, required test coverage, and maximum patch complexity for auto-approval.", icon: "🚦" },
      { title: "Notifications", desc: "Configure Slack, email, or webhook notifications for repairs, reviews, and security alerts.", icon: "🔔" },
    ],
  },
  {
    title: "Integrations",
    items: [
      { title: "GitHub Actions", desc: "WarpFix natively integrates with GitHub Actions. No additional CI configuration needed.", icon: "🔗" },
      { title: "Slack", desc: "Get repair notifications, review summaries, and failure alerts directly in your Slack channels.", icon: "💬" },
      { title: "Webhooks", desc: "Send repair events to any endpoint — integrate with PagerDuty, Datadog, or custom dashboards.", icon: "🌐" },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[var(--border-default)]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-warpfix.png" alt="WarpFix" width={28} height={28} />
            <span className="font-semibold text-[15px] text-[var(--text-primary)]">WarpFix</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/changelog" className="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
              Changelog
            </Link>
            <Link href="/roadmap" className="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
              Roadmap
            </Link>
            <Link href="/" className="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Documentation</h1>
        <p className="text-[var(--text-tertiary)] text-sm mb-12">
          Everything you need to install, configure, and use WarpFix effectively.
        </p>

        <div className="space-y-12">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">{section.title}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {section.items.map((item) => (
                  <div
                    key={item.title}
                    className="bg-white rounded-xl border border-[var(--border-default)] p-5 hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{item.icon}</span>
                      <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{item.title}</h3>
                    </div>
                    <p className="text-[13px] text-[var(--text-tertiary)] leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Example config */}
        <section className="mt-16">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Example .warpfix.yaml</h2>
          <div className="bg-[#1e1e2e] rounded-xl p-6 overflow-x-auto">
            <pre className="text-[13px] text-green-400 font-mono leading-relaxed">
{`# .warpfix.yaml — WarpFix configuration
version: 1

repair:
  auto_fix: true
  confidence_threshold: 0.75
  max_retries: 2
  sandbox_timeout: 300

quality_gates:
  min_confidence: 0.8
  require_tests: true
  max_patch_lines: 50
  block_on_security: true

review:
  auto_comment: true
  severity_labels: true
  mermaid_diagrams: true
  effort_estimates: true

ignore:
  paths:
    - "node_modules/**"
    - "dist/**"
    - "*.lock"
  errors:
    - "ECONNRESET"
    - "rate limit"

notifications:
  slack:
    channel: "#ci-repairs"
    on_repair: true
    on_failure: true
  email:
    to: "team@yourcompany.com"
    on_security: true`}
            </pre>
          </div>
        </section>

        {/* Help */}
        <div className="mt-12 bg-indigo-50 rounded-xl p-6 border border-indigo-100 text-center">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Need help?</h2>
          <p className="text-[14px] text-[var(--text-secondary)]">
            Reach out at{" "}
            <a href="mailto:support@warpfix.org" className="text-indigo-600 hover:underline font-medium">support@warpfix.org</a>{" "}
            or open an issue on{" "}
            <a href="https://github.com/bytepassperks/warpfix-intelligence-cloud" className="text-indigo-600 hover:underline font-medium" target="_blank" rel="noopener noreferrer">GitHub</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
