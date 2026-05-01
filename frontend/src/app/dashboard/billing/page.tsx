"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Check, ArrowRight } from "lucide-react";
import { SkeletonCard } from "@/components/ui/skeleton";
import { API_URL } from "@/lib/utils";
import Link from "next/link";

interface Subscription {
  current_plan: string;
  usage: { repairs_used: number; repairs_limit: number };
}

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "",
    description: "Basic CI repair",
    features: ["3 repairs / month", "1 repository", "Community support"],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/mo",
    description: "Unlimited repairs",
    features: ["Unlimited repairs", "Unlimited repos", "Sandbox validation", "Dependency radar", "Priority support"],
    highlighted: true,
  },
  {
    name: "Team",
    price: "$36",
    period: "/mo",
    description: "Org-level intelligence",
    features: ["Everything in Pro", "Shared fingerprints", "Team memory", "SSO", "Admin dashboard"],
    highlighted: false,
  },
];

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/billing/subscription`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setSub)
      .catch(() => setSub({ current_plan: "free", usage: { repairs_used: 0, repairs_limit: 3 } }));
  }, []);

  const usagePercent = sub
    ? sub.usage.repairs_limit === Infinity ? 0 : (sub.usage.repairs_used / sub.usage.repairs_limit) * 100
    : 0;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-xl font-semibold">Billing</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
          Manage your subscription and usage
        </p>
      </motion.div>

      {/* Usage card */}
      {sub === null ? (
        <SkeletonCard />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-[var(--border-default)] p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[13px] text-[var(--text-secondary)]">Current Plan</div>
              <div className="text-xl font-bold">{sub.current_plan.toUpperCase()}</div>
            </div>
            <div className="text-right">
              <div className="text-[13px] text-[var(--text-secondary)]">Usage This Month</div>
              <div className="text-xl font-bold">
                {sub.usage.repairs_used}
                <span className="text-[var(--text-tertiary)] text-sm">
                  /{sub.usage.repairs_limit === Infinity ? "Unlimited" : sub.usage.repairs_limit}
                </span>
              </div>
            </div>
          </div>
          {sub.usage.repairs_limit !== Infinity && (
            <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(usagePercent, 100)}%` }}
                transition={{ duration: 0.6 }}
                className={`h-2 rounded-full ${
                  usagePercent >= 90 ? "bg-red-500" : usagePercent >= 60 ? "bg-amber-400" : "bg-[var(--brand)]"
                }`}
              />
            </div>
          )}
        </motion.div>
      )}

      {/* Plans */}
      <h2 className="text-[15px] font-semibold mb-4">Available Plans</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-6 rounded-lg border bg-white transition-all ${
              plan.highlighted
                ? "border-[var(--brand)] shadow-md ring-1 ring-[var(--brand)]"
                : "border-[var(--border-default)] hover:shadow-sm"
            }`}
          >
            {plan.highlighted && (
              <div className="text-[11px] font-semibold text-[var(--brand)] uppercase tracking-wider mb-3">
                Recommended
              </div>
            )}
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <div className="flex items-baseline gap-0.5 mb-1">
              <span className="text-3xl font-bold">{plan.price}</span>
              {plan.period && <span className="text-[var(--text-secondary)] text-sm">{plan.period}</span>}
            </div>
            <p className="text-[13px] text-[var(--text-secondary)] mb-5">{plan.description}</p>
            <Link
              href="https://api.warpfix.org/auth/github"
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                plan.highlighted
                  ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
                  : "bg-[var(--bg-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-tertiary)]"
              }`}
            >
              {sub?.current_plan === plan.name.toLowerCase() ? "Current Plan" : "Upgrade"}
              {sub?.current_plan !== plan.name.toLowerCase() && <ArrowRight className="w-3.5 h-3.5" />}
            </Link>
            <ul className="mt-5 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[13px]">
                  <Check className="w-3.5 h-3.5 text-[var(--brand)] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
