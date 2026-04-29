"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap, GitBranch, Shield, Fingerprint, BarChart3, Radar,
  Terminal, ArrowRight, Check, ChevronDown,
  Cpu, Box, Eye, MessageSquareText, Gauge,
  BrainCircuit, ShieldAlert, Code2, TestTube2, Scale, SlidersHorizontal,
} from "lucide-react";

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
    </svg>
  );
}
import { TerminalDemo } from "@/components/terminal-demo";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const FEATURES = [
  {
    icon: Cpu,
    title: "Multi-Agent Pipeline",
    description: "Six specialized agents parse, classify, patch, validate, score, and ship fixes automatically.",
  },
  {
    icon: Fingerprint,
    title: "Fingerprint Learning",
    description: "Error patterns are hashed and cached. Proven fixes are reused instantly on repeat failures.",
  },
  {
    icon: Box,
    title: "Sandbox Validation",
    description: "Every patch is tested in an isolated container before any PR is opened.",
  },
  {
    icon: Eye,
    title: "PR Review Intelligence",
    description: "Auto-summaries, inline comments with severity, Mermaid diagrams, and effort estimation.",
  },
  {
    icon: MessageSquareText,
    title: "Chat Agent",
    description: "Mention @warpfix in any PR comment for instant security analysis, test suggestions, or explanations.",
  },
  {
    icon: Radar,
    title: "Dependency Radar",
    description: "Monitors npm for breaking releases and deprecated packages before they hit CI.",
  },
  {
    icon: BrainCircuit,
    title: "Predictive CI Failure",
    description: "Analyzes PR diffs before CI runs to predict failures and warn developers proactively.",
  },
  {
    icon: ShieldAlert,
    title: "Security Auto-Patching",
    description: "Detects CVEs and OWASP vulnerabilities in your code and dependencies, then auto-generates fix PRs.",
  },
  {
    icon: Code2,
    title: "Dead Code Detection",
    description: "Uses codegraph analysis to find unreachable and unused code across your codebase.",
  },
  {
    icon: TestTube2,
    title: "Test Coverage Gaps",
    description: "Identifies untested code paths in PRs and suggests missing test cases automatically.",
  },
  {
    icon: Scale,
    title: "Technical Debt Tracker",
    description: "Scores and tracks tech debt over time with A-F grades, trends, and actionable cleanup plans.",
  },
  {
    icon: SlidersHorizontal,
    title: "Quality Gates",
    description: "Custom pre-merge rules via .warpfix.yaml — block PRs that violate your team's quality standards.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "CI fails",
    desc: "GitHub fires a webhook the moment your workflow fails. WarpFix starts analyzing within seconds.",
  },
  {
    num: "02",
    title: "Analyze & patch",
    desc: "Logs are parsed, errors classified, fingerprints checked, and a safe patch is generated via LLM.",
  },
  {
    num: "03",
    title: "Validate & ship",
    desc: "Patch is tested in a sandbox, scored for confidence, and a PR is opened automatically.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "",
    description: "Get started with basic CI repair",
    features: ["3 repairs / month", "Error classification", "Fingerprint matching", "1 repository", "Community support"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/mo",
    description: "Unlimited repairs for serious developers",
    features: [
      "Unlimited repairs", "PR review intelligence", "Sandbox validation",
      "Predictive CI failure", "Security auto-patching", "Dead code detection",
      "Quality gates", "Dependency radar", "Unlimited repos", "Priority support",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$36",
    period: "/mo",
    description: "Org-level shared repair intelligence",
    features: [
      "Everything in Pro", "Shared fingerprints", "Team repair memory",
      "Tech debt tracking", "Test coverage analysis", "Org stability score",
      "Admin dashboard", "SSO", "Dedicated support",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const FAQS = [
  { q: "How does WarpFix detect CI failures?", a: "WarpFix integrates as a GitHub App. When a workflow fails, GitHub sends a webhook and WarpFix starts analyzing the failure logs immediately." },
  { q: "Is my code safe?", a: "WarpFix only reads logs and file contents needed for repair. All patches are validated in isolated sandboxes. The GitHub App uses minimal permissions." },
  { q: "What errors can WarpFix fix?", a: "Build errors, test failures, lint issues, type errors, dependency problems, runtime crashes, and configuration bugs." },
  { q: "How does fingerprint learning work?", a: "Each error is normalized and hashed. When the same pattern recurs, the proven fix is reused instantly with high confidence." },
  { q: "What if a patch has low confidence?", a: "Patches below 40 are flagged for review and not opened as PRs. Scores between 40-70 get a 'review suggested' label." },
  { q: "Can I use WarpFix without Warp terminal?", a: "Yes. The web dashboard and GitHub App work independently. Terminal commands are optional." },
];

const COMPARISON = [
  { feature: "CI failure auto-repair", wf: true, cr: false, sn: false },
  { feature: "PR review & summaries", wf: true, cr: true, sn: false },
  { feature: "Inline review comments", wf: true, cr: true, sn: false },
  { feature: "Sandbox validation", wf: true, cr: false, sn: false },
  { feature: "Fingerprint fix caching", wf: true, cr: false, sn: false },
  { feature: "Predictive CI failure", wf: true, cr: false, sn: false },
  { feature: "Security auto-patching", wf: true, cr: false, sn: "partial" },
  { feature: "Dead code detection", wf: true, cr: false, sn: false },
  { feature: "Test coverage gap analysis", wf: true, cr: false, sn: false },
  { feature: "Technical debt tracking", wf: true, cr: false, sn: false },
  { feature: "Quality gates", wf: true, cr: true, sn: true },
  { feature: "Dependency vulnerability scan", wf: true, cr: false, sn: true },
  { feature: "Chat agent in PRs", wf: true, cr: true, sn: false },
  { feature: "Multi-file patch generation", wf: true, cr: true, sn: false },
  { feature: "Confidence scoring", wf: true, cr: false, sn: false },
  { feature: "Free tier", wf: true, cr: true, sn: true },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ─── Nav ─── */}
      <nav className="fixed top-0 w-full z-50 border-b border-[var(--border-default)] bg-white/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[var(--brand)] rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-[15px]">WarpFix</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-[13px] text-[var(--text-secondary)]">
            <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[var(--text-primary)] transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-[var(--text-primary)] transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-[var(--text-primary)] transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="https://warpfix-api.onrender.com/auth/github"
              className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="https://warpfix-api.onrender.com/auth/github"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--brand)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-hover)] transition-colors"
            >
              <GitHubIcon className="w-3.5 h-3.5" />
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-24 px-6 hero-gradient overflow-hidden">
        {/* Beam + grid + orbs */}
        <div className="hero-beam" />
        <div className="absolute inset-0 animated-grid" />
        <div className="orb orb-indigo orb-float w-[600px] h-[600px] -top-64 -right-32" />
        <div className="orb orb-violet orb-float-delay w-[450px] h-[450px] top-16 -left-40" />
        <div className="orb orb-blue orb-float-delay2 w-[350px] h-[350px] bottom-0 right-1/4" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--brand-muted)] text-[var(--brand-text)] rounded-full text-xs font-medium mb-8">
              <Terminal className="w-3 h-3" />
              Terminal-native CI repair agent
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[clamp(2.5rem,6vw,3.75rem)] font-bold tracking-tight leading-[1.08] mb-5"
          >
            Your CI pipeline<br />
            <span className="gradient-text">fixes itself</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto mb-10 leading-relaxed"
          >
            WarpFix detects failures, generates safe patches, validates them in sandboxes,
            and opens pull requests — automatically.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
          >
            <Link
              href="https://warpfix-api.onrender.com/auth/github"
              className="flex items-center gap-2 px-6 py-2.5 bg-[var(--brand)] text-white rounded-lg font-medium hover:bg-[var(--brand-hover)] transition-colors shadow-md shadow-indigo-200"
            >
              Start fixing for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="px-6 py-2.5 border border-[var(--border-default)] rounded-lg font-medium hover:bg-[var(--bg-secondary)] hover:border-[var(--border-hover)] transition-colors text-[var(--text-primary)]"
            >
              See how it works
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="terminal-glow"
          >
            <TerminalDemo />
          </motion.div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="py-12 px-6 border-y border-[var(--border-default)] bg-white/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: "12", label: "Specialized engines" },
            { num: "95%", label: "Avg confidence score" },
            { num: "<30s", label: "Avg repair time" },
            { num: "37%", label: "Faster with fingerprints" },
          ].map((s) => (
            <div key={s.label}>
              <div className="stat-number text-3xl font-bold text-[var(--brand)] mb-1">{s.num}</div>
              <div className="text-[13px] text-[var(--text-secondary)]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="relative py-24 px-6 section-gradient-warm overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl font-bold tracking-tight mb-3">
              Everything to keep CI green
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-[var(--text-secondary)] max-w-xl mx-auto">
              From failure detection to fix delivery — 12 specialized engines for CI repair, code review, security, and quality.
            </motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i + 2}
                className="group p-6 rounded-xl feature-card"
              >
                <div className="feature-icon-box w-10 h-10 rounded-lg bg-[var(--brand-muted)] flex items-center justify-center mb-4 transition-all duration-300">
                  <f.icon className="w-5 h-5 text-[var(--brand)]" />
                </div>
                <h3 className="font-semibold text-[15px] mb-1.5">{f.title}</h3>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="relative py-24 px-6 overflow-hidden">
        <div className="orb orb-blue orb-float-delay w-[400px] h-[400px] -bottom-32 -left-20" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-3">How <span className="gradient-text">WarpFix</span> works</h2>
            <p className="text-[var(--text-secondary)]">From failure to fix in seconds</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.5 }}
                className="relative"
              >
                <div className="text-[56px] font-bold text-[var(--brand-muted)] leading-none mb-3">{step.num}</div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{step.desc}</p>
                {i < 2 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-3 w-5 h-5 text-[var(--border-default)]" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Fingerprint Intelligence ─── */}
      <section className="relative py-24 px-6 section-gradient-cool overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[var(--brand-text)] bg-[var(--brand-muted)] rounded-full mb-4">
                <Fingerprint className="w-3 h-3" />
                Unique to WarpFix
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-4">Repair fingerprint intelligence</h2>
              <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
                Every error is hashed into a unique fingerprint. When the same pattern
                appears again, WarpFix reuses the proven fix — turning minutes into milliseconds.
              </p>
              <ul className="space-y-3">
                {[
                  "Error patterns normalized and hashed",
                  "Fixes stored with confidence scores",
                  "Org-wide shared repair memory",
                  "Accuracy improves over time",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px]">
                    <Check className="w-4 h-4 text-[var(--brand)] mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[var(--bg-inverse)] rounded-xl p-6 font-mono text-sm shadow-lg">
              <div className="text-gray-500 text-xs mb-1">fingerprint.hash</div>
              <div className="text-[var(--brand)] mb-4">a3f8c2d1e5b74910</div>
              <div className="text-gray-500 text-xs mb-1">times_matched</div>
              <div className="text-emerald-400 mb-4">47</div>
              <div className="text-gray-500 text-xs mb-1">resolution_confidence</div>
              <div className="text-amber-400 mb-4">92 / 100</div>
              <div className="text-gray-500 text-xs mb-1">avg_resolution_time</div>
              <div className="text-white">340ms</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Comparison ─── */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="orb orb-indigo orb-float w-[350px] h-[350px] top-10 -right-20" />
        <div className="orb orb-violet orb-float-delay w-[250px] h-[250px] bottom-10 -left-16" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-3">How we compare</h2>
            <p className="text-[var(--text-secondary)]">WarpFix is the only platform that repairs, reviews, and secures — all in one.</p>
          </div>
          <div className="rounded-xl border border-[var(--border-default)] overflow-hidden bg-white">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
                  <th className="text-left py-3 px-5 font-medium text-[var(--text-secondary)]">Feature</th>
                  <th className="text-center py-3 px-5 font-semibold text-[var(--brand)]">WarpFix</th>
                  <th className="text-center py-3 px-5 font-medium text-[var(--text-secondary)]">CodeRabbit</th>
                  <th className="text-center py-3 px-5 font-medium text-[var(--text-secondary)]">Snyk</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b border-[var(--border-default)] last:border-0">
                    <td className="py-3 px-5">{row.feature}</td>
                    <td className="py-3 px-5 text-center">
                      {row.wf ? <Check className="w-4 h-4 text-[var(--brand)] mx-auto" /> : <span className="text-[var(--text-tertiary)]">—</span>}
                    </td>
                    <td className="py-3 px-5 text-center">
                      {row.cr ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <span className="text-[var(--text-tertiary)]">—</span>}
                    </td>
                    <td className="py-3 px-5 text-center">
                      {row.sn === "partial" ? (
                        <span className="text-[11px] font-medium text-amber-500">Partial</span>
                      ) : row.sn ? (
                        <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : (
                        <span className="text-[var(--text-tertiary)]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="relative py-24 px-6 section-gradient-warm overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-3">Simple pricing</h2>
            <p className="text-[var(--text-secondary)]">Start free. Scale as you grow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`p-6 rounded-xl border bg-white transition-shadow ${
                  plan.highlighted
                    ? "border-[var(--brand)] pricing-ring"
                    : "border-[var(--border-default)] hover:shadow-md"
                }`}
              >
                {plan.highlighted && (
                  <div className="text-[11px] font-semibold text-[var(--brand)] uppercase tracking-wider mb-3">Most Popular</div>
                )}
                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-0.5 mb-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-[var(--text-secondary)] text-sm">{plan.period}</span>}
                </div>
                <p className="text-[13px] text-[var(--text-secondary)] mb-5">{plan.description}</p>
                <Link
                  href="https://warpfix-api.onrender.com/auth/github"
                  className={`block text-center py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                    plan.highlighted
                      ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
                      : "bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-default)]"
                  }`}
                >
                  {plan.cta}
                </Link>
                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-[13px]">
                      <Check className="w-3.5 h-3.5 text-[var(--brand)] shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="relative py-24 px-6 section-gradient-cool overflow-hidden">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="border border-[var(--border-default)] rounded-lg overflow-hidden bg-white"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <span className="font-medium text-[14px]">{faq.q}</span>
                  <motion.div
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" />
                  </motion.div>
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openFaq === i ? "auto" : 0,
                    opacity: openFaq === i ? 1 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 text-[13px] text-[var(--text-secondary)] leading-relaxed">
                    {faq.a}
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative py-28 px-6 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] text-white overflow-hidden">
        <div className="orb cta-glow w-[600px] h-[600px] -top-40 -right-40" style={{background: 'radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)'}} />
        <div className="orb cta-glow w-[400px] h-[400px] bottom-0 -left-20" style={{background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)', animationDelay: '2s'}} />
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Ready to stop babysitting CI?</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Install WarpFix in under a minute. Your next CI failure fixes itself.
          </p>
          <Link
            href="https://warpfix-api.onrender.com/auth/github"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--brand)] text-white rounded-lg font-medium hover:bg-[var(--brand-hover)] transition-colors shadow-lg shadow-indigo-900/30"
          >
            <GitHubIcon className="w-4 h-4" />
            Install WarpFix
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-8 px-6 border-t border-[var(--border-default)] bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[var(--text-tertiary)]">
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[var(--brand)]" />
            <span>WarpFix</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[var(--text-secondary)] transition-colors">Docs</a>
            <a href="#" className="hover:text-[var(--text-secondary)] transition-colors">GitHub</a>
            <a href="#" className="hover:text-[var(--text-secondary)] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[var(--text-secondary)] transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
