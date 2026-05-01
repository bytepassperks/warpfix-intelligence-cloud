"use client";

import { motion } from "framer-motion";
import { BookOpen, Copy, Check, Terminal, FileCode, Package, TestTube2, Shield, Zap } from "lucide-react";
import { useState } from "react";

const RECIPES = [
  {
    id: "flaky-jest",
    title: "Stop Flaky Jest Tests from Blocking CI",
    desc: "Auto-detect flaky tests, quarantine them, and get fix suggestions — all without LLM tokens.",
    icon: TestTube2,
    difficulty: "Easy",
    time: "5 min",
    tags: ["Jest", "Testing", "Free"],
    yaml: `# .warpfix.yaml — Flaky Jest test management
version: 1

flaky_tests:
  enabled: true
  detection:
    min_runs: 10
    flake_threshold: 0.05
  strategy: quarantine
  auto_retry: 3
  report_to_pr: true

repair:
  auto_fix: true
  confidence_threshold: 0.75`,
    steps: [
      "Add the .warpfix.yaml config above to your repo root",
      "Install WarpFix GitHub App on the repository",
      "WarpFix starts tracking test pass/fail history automatically",
      "After 10+ runs, flaky tests are identified and quarantined",
      "Fix suggestions appear as PR comments — no LLM cost",
    ],
  },
  {
    id: "eslint-auto",
    title: "Auto-Fix ESLint Errors Without LLM",
    desc: "Run eslint --fix in WarpFix sandbox to resolve style and lint issues at zero token cost.",
    icon: FileCode,
    difficulty: "Easy",
    time: "3 min",
    tags: ["ESLint", "Linting", "Free"],
    yaml: `# .warpfix.yaml — ESLint auto-fix
version: 1

static_tools:
  eslint:
    enabled: true
    fix: true
    config: .eslintrc.json
  prettier:
    enabled: true
    fix: true

repair:
  prefer_static: true
  llm_fallback: true`,
    steps: [
      "Add the config to your repo",
      "WarpFix runs eslint --fix and prettier --write in sandbox",
      "Deterministic fixes are applied at zero LLM cost",
      "Only non-trivial issues get escalated to the LLM pipeline",
    ],
  },
  {
    id: "npm-breaking",
    title: "Catch Breaking npm Releases Before They Hit CI",
    desc: "Monitor dependencies for breaking changes, deprecations, and security issues proactively.",
    icon: Package,
    difficulty: "Easy",
    time: "2 min",
    tags: ["npm", "Dependencies", "Free"],
    yaml: `# .warpfix.yaml — Dependency monitoring
version: 1

dependency_radar:
  enabled: true
  check_frequency: daily
  alert_on:
    - breaking_changes
    - deprecations
    - security_advisories
  auto_pr: false  # comment-only on free tier
  
notifications:
  slack:
    channel: "#ci-alerts"
    on_dependency_alert: true`,
    steps: [
      "Add the config — WarpFix scans package.json daily",
      "Breaking releases are flagged before they hit your lockfile",
      "Deprecated packages get migration suggestions",
      "Security advisories trigger immediate alerts",
    ],
  },
  {
    id: "terraform-lint",
    title: "Keep Terraform/Helm Charts Lint-Clean",
    desc: "Auto-validate IaC files with tflint, checkov, and helm lint — catch misconfigs before apply.",
    icon: Shield,
    difficulty: "Medium",
    time: "10 min",
    tags: ["Terraform", "Helm", "IaC"],
    yaml: `# .warpfix.yaml — IaC linting
version: 1

static_tools:
  tflint:
    enabled: true
    config: .tflint.hcl
  checkov:
    enabled: true
    framework: terraform
  helm_lint:
    enabled: true
    charts:
      - charts/

quality_gates:
  block_on_security: true
  iac_scan: required`,
    steps: [
      "Add the config with your IaC tool preferences",
      "tflint catches Terraform misconfigurations",
      "checkov scans for security policy violations",
      "helm lint validates chart structure and values",
      "Failures appear as annotated PR comments",
    ],
  },
  {
    id: "coverage-gaps",
    title: "Find and Fill Test Coverage Gaps in PRs",
    desc: "Identify untested code paths in every PR and get concrete test suggestions.",
    icon: TestTube2,
    difficulty: "Medium",
    time: "5 min",
    tags: ["Coverage", "Testing", "Pro"],
    yaml: `# .warpfix.yaml — Coverage gap analysis
version: 1

coverage:
  enabled: true
  provider: istanbul  # or lcov, cobertura
  threshold: 80
  report_uncovered_lines: true
  suggest_tests: true

quality_gates:
  min_coverage_delta: 0  # no regressions allowed
  block_on_coverage_drop: true`,
    steps: [
      "Configure your coverage provider in the YAML",
      "WarpFix analyzes which changed lines lack test coverage",
      "Concrete test suggestions are posted as PR comments",
      "Coverage regressions are blocked via quality gates",
    ],
  },
  {
    id: "ci-doctor",
    title: "Run WarpFix Doctor in Your Terminal",
    desc: "Local CLI that queries CI history, diagnoses failures, and suggests fixes without touching GitHub.",
    icon: Terminal,
    difficulty: "Easy",
    time: "1 min",
    tags: ["CLI", "Local", "Free"],
    yaml: `# Terminal commands
$ npx warpfix doctor

# Output:
# 🔍 Scanning CI history for repo: my-app
# 
# ❌ 3 failures in last 24h
#   ├─ TypeError in src/api/handler.ts (fingerprint: a3f8c2d1)
#   ├─ ESLint import/order in src/utils.ts (auto-fixable)
#   └─ Test timeout in tests/integration.test.ts (flaky: 18%)
#
# 💡 Suggested: run \`npx warpfix fix --dry-run\` to preview patches`,
    steps: [
      "Install: npm install -g warpfix-cli",
      "Run: npx warpfix doctor in your repo",
      "View CI failure history, fingerprints, and suggestions",
      "Use --dry-run to preview patches locally before pushing",
      "All processing happens locally — no cloud tokens needed",
    ],
  },
];

export default function CookbookPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>("flaky-jest");

  const copyYaml = (id: string, yaml: string) => {
    navigator.clipboard.writeText(yaml);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Cookbook & Recipes</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Copy-paste recipes to solve common CI pain points. Each recipe uses WarpFix + cheap/static tools for maximum value at minimal cost.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {RECIPES.map((recipe) => (
          <motion.div
            key={recipe.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
              expandedRecipe === recipe.id ? "border-indigo-300 shadow-sm" : "border-[var(--border-default)] hover:border-indigo-200"
            }`}
            onClick={() => setExpandedRecipe(expandedRecipe === recipe.id ? null : recipe.id)}
          >
            <div className="flex items-center gap-2 mb-2">
              <recipe.icon className="w-5 h-5 text-indigo-600" />
              <span className="text-[13px] font-semibold text-[var(--text-primary)]">{recipe.title}</span>
            </div>
            <p className="text-[12px] text-[var(--text-tertiary)] mb-3">{recipe.desc}</p>
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {recipe.tags.map((tag) => (
                  <span key={tag} className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                    tag === "Free" ? "bg-green-50 text-green-700 border border-green-200"
                    : tag === "Pro" ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    : "bg-gray-50 text-gray-600 border border-gray-200"
                  }`}>
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
                <span>{recipe.difficulty}</span>
                <span>•</span>
                <span>{recipe.time}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Expanded recipe detail */}
      {expandedRecipe && (() => {
        const recipe = RECIPES.find((r) => r.id === expandedRecipe);
        if (!recipe) return null;
        return (
          <motion.div
            key={recipe.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden mb-6"
          >
            <div className="px-6 py-4 border-b border-[var(--border-default)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <recipe.icon className="w-5 h-5 text-indigo-600" />
                <span className="text-[15px] font-semibold text-[var(--text-primary)]">{recipe.title}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); copyYaml(recipe.id, recipe.yaml); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-secondary)] rounded-lg text-[12px] font-medium hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                {copiedId === recipe.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedId === recipe.id ? "Copied!" : "Copy Config"}
              </button>
            </div>
            <div className="grid md:grid-cols-2 divide-x divide-[var(--border-default)]">
              <div className="p-6">
                <div className="text-[12px] font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-3">Configuration</div>
                <div className="bg-[#1e1e2e] rounded-lg p-4 overflow-x-auto">
                  <pre className="text-[12px] text-green-400 font-mono leading-relaxed whitespace-pre">
                    {recipe.yaml}
                  </pre>
                </div>
              </div>
              <div className="p-6">
                <div className="text-[12px] font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-3">Steps</div>
                <div className="space-y-3">
                  {recipe.steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-[13px] text-[var(--text-secondary)]">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })()}
    </div>
  );
}
