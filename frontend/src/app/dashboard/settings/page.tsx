"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Copy, Check, Terminal, RefreshCw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.warpfix.org";

export default function SettingsPage() {
  const [profile, setProfile] = useState("assertive");
  const [autoReview, setAutoReview] = useState(true);
  const [autoRepair, setAutoRepair] = useState(true);
  const [copied, setCopied] = useState(false);
  const [cliKey, setCliKey] = useState<string | null>(null);
  const [cliKeyLoading, setCliKeyLoading] = useState(false);
  const [cliKeyCopied, setCliKeyCopied] = useState(false);

  useEffect(() => {
    fetch(`${API}/auth/cli-key`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCliKey(d.cli_api_key || null))
      .catch(() => {});
  }, []);

  const generateCliKey = async () => {
    setCliKeyLoading(true);
    try {
      const r = await fetch(`${API}/auth/cli-key`, { method: "POST", credentials: "include" });
      const d = await r.json();
      if (d.cli_api_key) setCliKey(d.cli_api_key);
    } catch {}
    setCliKeyLoading(false);
  };

  const copyCliKey = () => {
    if (cliKey) {
      navigator.clipboard.writeText(cliKey);
      setCliKeyCopied(true);
      setTimeout(() => setCliKeyCopied(false), 2000);
    }
  };

  const yamlExample = `# .warpfix.yaml
review:
  profile: ${profile}
  auto_review: ${autoReview}
  path_instructions:
    - glob: "src/auth/**"
      instruction: "Check for security vulnerabilities"
    - glob: "**/*.test.js"
      instruction: "Verify test coverage"
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
  security_scan: true
  predictive_ci: true

quality_gates:
  - name: "No console.log in production"
    rule: "No console.log in src/ files"

chat:
  enabled: true`;

  const handleCopy = () => {
    navigator.clipboard.writeText(yamlExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
          Configure how WarpFix reviews and repairs your code
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Review Profile */}
        <div className="bg-white rounded-lg border border-[var(--border-default)] p-6">
          <h3 className="font-semibold text-[15px] mb-4">Review Profile</h3>
          <div className="space-y-2">
            {[
              { value: "assertive", label: "Assertive", desc: "Thorough — flags all issues including style" },
              { value: "chill", label: "Chill", desc: "Lenient — only critical issues, no nitpicks" },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                  profile === option.value
                    ? "border-[var(--brand)] bg-[var(--brand-muted)]"
                    : "border-[var(--border-default)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-secondary)]"
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  profile === option.value ? "border-[var(--brand)]" : "border-[var(--border-hover)]"
                }`}>
                  {profile === option.value && (
                    <div className="w-2 h-2 rounded-full bg-[var(--brand)]" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-[14px]">{option.label}</div>
                  <div className="text-[12px] text-[var(--text-secondary)]">{option.desc}</div>
                </div>
                <input
                  type="radio"
                  name="profile"
                  value={option.value}
                  checked={profile === option.value}
                  onChange={() => setProfile(option.value)}
                  className="sr-only"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Automation */}
        <div className="bg-white rounded-lg border border-[var(--border-default)] p-6">
          <h3 className="font-semibold text-[15px] mb-4">Automation</h3>
          <div className="space-y-4">
            {[
              { label: "Auto Review PRs", desc: "Automatically review every new PR", value: autoReview, set: setAutoReview },
              { label: "Auto Repair CI", desc: "Automatically fix CI failures", value: autoRepair, set: setAutoRepair },
            ].map((toggle) => (
              <div key={toggle.label} className="flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-medium">{toggle.label}</div>
                  <div className="text-[12px] text-[var(--text-secondary)]">{toggle.desc}</div>
                </div>
                <button
                  onClick={() => toggle.set(!toggle.value)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    toggle.value ? "bg-[var(--brand)]" : "bg-[var(--bg-tertiary)]"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                      toggle.value ? "left-5" : "left-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CLI API Key */}
      <div className="bg-white rounded-lg border border-[var(--border-default)] p-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Terminal className="w-4 h-4 text-indigo-600" />
          <h3 className="font-semibold text-[15px]">CLI API Key</h3>
        </div>
        <p className="text-[12px] text-[var(--text-secondary)] mb-4">
          Use this key to authenticate the WarpFix CLI. Install with <code className="bg-[var(--bg-secondary)] px-1 py-0.5 rounded text-[11px]">npm i -g warpfix</code> then run <code className="bg-[var(--bg-secondary)] px-1 py-0.5 rounded text-[11px]">warpfix login &lt;key&gt;</code>
        </p>
        {cliKey ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-[var(--bg-secondary)] px-3 py-2 rounded-lg text-[13px] font-mono truncate">
              {cliKey}
            </code>
            <button
              onClick={copyCliKey}
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              {cliKeyCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {cliKeyCopied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={generateCliKey}
              disabled={cliKeyLoading}
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cliKeyLoading ? "animate-spin" : ""}`} />
              Regenerate
            </button>
          </div>
        ) : (
          <button
            onClick={generateCliKey}
            disabled={cliKeyLoading}
            className="px-4 py-2 bg-[var(--brand)] text-white text-[13px] font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            {cliKeyLoading ? "Generating..." : "Generate API Key"}
          </button>
        )}
      </div>

      {/* YAML Config */}
      <div className="bg-white rounded-lg border border-[var(--border-default)] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-[15px]">.warpfix.yaml</h3>
            <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
              Add to your repo root to customize per-repo behavior
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg border border-[var(--border-default)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="bg-[var(--bg-inverse)] text-gray-300 p-4 rounded-lg text-[12px] font-mono overflow-x-auto leading-relaxed">
          {yamlExample}
        </pre>
      </div>
    </div>
  );
}
