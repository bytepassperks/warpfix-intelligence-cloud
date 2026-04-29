"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [profile, setProfile] = useState("assertive");
  const [autoReview, setAutoReview] = useState(true);
  const [autoRepair, setAutoRepair] = useState(true);

  const yamlExample = `# .warpfix.yaml — Place this in your repo root
review:
  profile: ${profile}
  auto_review: ${autoReview}
  path_instructions:
    - glob: "src/auth/**"
      instruction: "Check for security vulnerabilities"
    - glob: "**/*.test.js"
      instruction: "Verify test coverage is comprehensive"
  ignore_paths:
    - "dist/**"
    - "*.min.js"

repair:
  auto_fix: ${autoRepair}
  min_confidence: 60
  skip_branches:
    - "release/*"

analysis:
  dead_code: true
  tech_debt: true
  test_coverage: true
  security_scan: true
  predictive_ci: true
  pr_splitting: true

quality_gates:
  - name: "No console.log in production"
    rule: "No console.log statements in src/ files"
  - name: "Functions under 50 lines"
    rule: "No function should exceed 50 lines of code"

chat:
  enabled: true`;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Configuration</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Review Profile</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/30">
              <input type="radio" name="profile" value="assertive" checked={profile === "assertive"} onChange={() => setProfile("assertive")} />
              <div>
                <div className="font-medium">Assertive</div>
                <div className="text-xs text-muted-foreground">Thorough review — flags all issues including style and naming</div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/30">
              <input type="radio" name="profile" value="chill" checked={profile === "chill"} onChange={() => setProfile("chill")} />
              <div>
                <div className="font-medium">Chill</div>
                <div className="text-xs text-muted-foreground">Lenient — only flags critical issues, ignores style nitpicks</div>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Automation Settings</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Auto Review PRs</div>
                <div className="text-xs text-muted-foreground">Automatically review every new PR</div>
              </div>
              <input type="checkbox" checked={autoReview} onChange={() => setAutoReview(!autoReview)} className="w-5 h-5" />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Auto Repair CI</div>
                <div className="text-xs text-muted-foreground">Automatically fix CI failures</div>
              </div>
              <input type="checkbox" checked={autoRepair} onChange={() => setAutoRepair(!autoRepair)} className="w-5 h-5" />
            </label>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold mb-2">.warpfix.yaml Configuration</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add this file to your repository root to customize WarpFix behavior per-repo:
        </p>
        <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
          {yamlExample}
        </pre>
        <button
          onClick={() => navigator.clipboard.writeText(yamlExample)}
          className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
        >
          Copy to Clipboard
        </button>
      </div>
    </div>
  );
}
