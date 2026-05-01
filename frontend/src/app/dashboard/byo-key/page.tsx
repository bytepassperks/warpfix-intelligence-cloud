"use client";

import { motion } from "framer-motion";
import { Key, Shield, Zap, Server, Terminal, Eye, EyeOff, CheckCircle2, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function ByoKeyPage() {
  const [showKey, setShowKey] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string>("openai");
  const [keyValue, setKeyValue] = useState("");
  const [saved, setSaved] = useState(false);

  const PROVIDERS = [
    { id: "openai", name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "o1-preview"], icon: "🤖", desc: "Best for complex multi-file patches and deep code reasoning" },
    { id: "anthropic", name: "Anthropic", models: ["claude-sonnet-4-20250514", "claude-3.5-haiku"], icon: "🧠", desc: "Excellent for nuanced code review and security analysis" },
    { id: "google", name: "Google", models: ["gemini-2.0-flash", "gemini-1.5-pro"], icon: "🔷", desc: "Cost-effective for high-volume classification and summaries" },
  ];

  const COST_COMPARISON = [
    { feature: "Error classification", house: "$0", byo: "$0", note: "Always uses house model" },
    { feature: "Simple patches", house: "$0", byo: "~$0.01/fix", note: "House model handles most" },
    { feature: "Multi-file refactors", house: "Pro plan", byo: "~$0.10/fix", note: "Complex reasoning needed" },
    { feature: "Deep PR review", house: "Pro plan", byo: "~$0.05/review", note: "Security + edge cases" },
    { feature: "Run-until-green loops", house: "Team plan", byo: "~$0.50/loop", note: "Multiple iterations" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Bring Your Own Key</h1>
        <p className="text-[13px] text-[var(--text-tertiary)]">
          Plug in your own OpenAI, Anthropic, or Google API key for heavy features. WarpFix orchestrates; you control the LLM bill.
        </p>
      </div>

      {/* How it works */}
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        {[
          { icon: Key, title: "Your Key, Your Bill", desc: "Use your own API key for expensive flows: multi-file refactors, deep reviews, run-until-green loops. WarpFix keeps a small house model for cheap tasks.", color: "text-indigo-600" },
          { icon: Shield, title: "Keys Never Stored", desc: "Your API key is encrypted in transit and held only in memory during processing. Never logged, never persisted to disk.", color: "text-green-600" },
          { icon: Terminal, title: "Local Agent Mode", desc: "Run WarpFix CLI locally — processing happens on your machine with your key. Only validation/PR wiring goes through the cloud.", color: "text-blue-600" },
        ].map((item) => (
          <motion.div key={item.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-[var(--border-default)] p-4">
            <item.icon className={`w-5 h-5 ${item.color} mb-2`} />
            <div className="text-[13px] font-semibold text-[var(--text-primary)] mb-1">{item.title}</div>
            <div className="text-[12px] text-[var(--text-tertiary)]">{item.desc}</div>
          </motion.div>
        ))}
      </div>

      {/* Provider selection */}
      <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-[var(--border-default)]">
          <span className="text-[13px] font-semibold">Configure API Key</span>
        </div>
        <div className="p-5">
          <div className="flex gap-2 mb-4">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveProvider(p.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                  activeProvider === p.id ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                }`}
              >
                <span>{p.icon}</span>
                {p.name}
              </button>
            ))}
          </div>

          {(() => {
            const provider = PROVIDERS.find((p) => p.id === activeProvider);
            if (!provider) return null;
            return (
              <div>
                <p className="text-[12px] text-[var(--text-tertiary)] mb-3">{provider.desc}</p>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[12px] text-[var(--text-secondary)]">Available models:</span>
                  {provider.models.map((m) => (
                    <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-200 font-mono">{m}</span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={keyValue}
                      onChange={(e) => { setKeyValue(e.target.value); setSaved(false); }}
                      placeholder={`Enter your ${provider.name} API key`}
                      className="w-full px-3 py-2.5 border border-[var(--border-default)] rounded-lg text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 pr-10"
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button
                    onClick={() => setSaved(true)}
                    className={`px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                      saved ? "bg-green-50 text-green-700 border border-green-200" : "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
                    }`}
                  >
                    {saved ? <><CheckCircle2 className="w-4 h-4 inline mr-1" />Saved</> : "Save Key"}
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--text-tertiary)]">
                  <Shield className="w-3 h-3" />
                  Encrypted in transit (TLS 1.3). Held in memory only during processing. Never logged or persisted.
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Cost comparison */}
      <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-[var(--border-default)]">
          <span className="text-[13px] font-semibold">Cost Comparison: House Model vs BYO Key</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
                <th className="text-left px-5 py-2.5 font-semibold text-[var(--text-primary)]">Feature</th>
                <th className="text-center px-5 py-2.5 font-semibold text-[var(--text-primary)]">WarpFix Model</th>
                <th className="text-center px-5 py-2.5 font-semibold text-[var(--text-primary)]">Your Key</th>
                <th className="text-left px-5 py-2.5 font-semibold text-[var(--text-tertiary)]">Note</th>
              </tr>
            </thead>
            <tbody>
              {COST_COMPARISON.map((row) => (
                <tr key={row.feature} className="border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-secondary)]">
                  <td className="px-5 py-3 text-[var(--text-primary)]">{row.feature}</td>
                  <td className="px-5 py-3 text-center">{row.house}</td>
                  <td className="px-5 py-3 text-center font-mono text-indigo-600">{row.byo}</td>
                  <td className="px-5 py-3 text-[var(--text-tertiary)]">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CLI mode */}
      <div className="bg-white rounded-xl border border-[var(--border-default)] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-5 h-5 text-indigo-600" />
          <span className="text-[14px] font-semibold text-[var(--text-primary)]">Local Agent Mode</span>
        </div>
        <p className="text-[12px] text-[var(--text-tertiary)] mb-3">
          Run WarpFix locally with your own API key. Processing happens on your machine — only PR creation goes through the cloud.
        </p>
        <div className="bg-[#1e1e2e] rounded-lg p-4 font-mono text-[12px]">
          <div className="text-gray-500"># Install the CLI</div>
          <div className="text-green-400">$ npm install -g warpfix-cli</div>
          <div className="text-gray-500 mt-2"># Set your API key</div>
          <div className="text-green-400">$ export OPENAI_API_KEY=sk-...</div>
          <div className="text-gray-500 mt-2"># Run local repair with your key</div>
          <div className="text-green-400">$ warpfix fix --local --model gpt-4o</div>
          <div className="text-gray-500 mt-2"># Dry-run without pushing</div>
          <div className="text-green-400">$ warpfix fix --dry-run --model claude-sonnet-4-20250514</div>
        </div>
      </div>
    </div>
  );
}
