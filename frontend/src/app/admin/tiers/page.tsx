"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "../layout";
import { Check, X as XIcon } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.warpfix.org";

interface TierLimits {
  [feature: string]: number | boolean;
}

export default function TiersPage() {
  const { token } = useAdmin();
  const [tiers, setTiers] = useState<Record<string, TierLimits>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/admin/tiers`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setTiers(data.tiers || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[var(--border-default)] p-6">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-6 bg-gray-100 rounded w-full" />)}
        </div>
      </div>
    );
  }

  const tierNames = Object.keys(tiers);
  const features = tierNames.length > 0 ? Object.keys(tiers[tierNames[0]]) : [];

  const featureLabels: Record<string, string> = {
    repairs_per_month: "Repairs / Month",
    repos_limit: "Repository Limit",
    repos: "Repository Limit",
    reviews: "PR Reviews",
    reviews_enabled: "PR Reviews",
    security: "Security Scan",
    security_scan: "Security Scan",
    pr_split: "PR Split Engine",
    dead_code: "Dead Code Detection",
    dead_code_detection: "Dead Code Detection",
    test_coverage: "Test Coverage Analysis",
    tech_debt: "Tech Debt Tracking",
    tech_debt_tracking: "Tech Debt Tracking",
    quality_gates: "Quality Gates",
    dependency_radar: "Dependency Radar",
    predictive_ci: "Predictive CI",
    chat_agent: "Chat Agent (@warpfix)",
    custom_rules: "Custom Rules",
    priority_queue: "Priority Queue",
    api_access: "API Access",
    webhooks: "Webhooks",
    retention_days: "Data Retention",
  };

  return (
    <div className="space-y-6">
      <p className="text-[13px] text-[var(--text-tertiary)]">Current tier feature matrix. These are enforced by the backend tier-gating middleware.</p>

      <div className="bg-white rounded-xl border border-[var(--border-default)] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[var(--border-default)] bg-[var(--bg-secondary)]">
              <th className="px-4 py-3 text-left font-medium text-[var(--text-tertiary)] w-[240px]">Feature</th>
              {tierNames.map((t) => (
                <th key={t} className="px-4 py-3 text-center font-semibold capitalize">{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature) => (
              <tr key={feature} className="border-b border-[var(--border-default)] hover:bg-[var(--bg-secondary)]/50">
                <td className="px-4 py-3 font-medium">{featureLabels[feature] || feature.replace(/_/g, " ")}</td>
                {tierNames.map((t) => {
                  const val = tiers[t][feature];
                  return (
                    <td key={t} className="px-4 py-3 text-center">
                      {typeof val === "boolean" ? (
                        val ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <XIcon className="w-4 h-4 text-gray-300 mx-auto" />
                      ) : (
                        <span className="font-medium">
                          {val === -1 ? "Unlimited" : feature === "retention_days" ? `${val} days` : val}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-[var(--border-default)] p-5">
        <h3 className="text-[14px] font-semibold mb-3">Pricing</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { plan: "free", price: "Free", desc: "For individual developers" },
            { plan: "pro", price: "₹999/mo", desc: "For professional developers" },
            { plan: "team", price: "₹2,999/mo", desc: "For teams and organizations" },
          ].map((p) => (
            <div key={p.plan} className={`p-4 rounded-lg border ${p.plan === "pro" ? "border-[var(--brand)] bg-[var(--brand)]/5" : "border-[var(--border-default)]"}`}>
              <h4 className="font-semibold capitalize text-[14px]">{p.plan}</h4>
              <p className="text-xl font-bold mt-1">{p.price}</p>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-1">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
