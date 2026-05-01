"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowRight, Tag, Sparkles, Zap, LogIn } from "lucide-react";
import { SkeletonCard } from "@/components/ui/skeleton";
import { API_URL } from "@/lib/utils";
import { useUser } from "@/lib/user-context";

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
  const { user, loading: userLoading } = useUser();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<"idle" | "applying" | "success" | "error">("idle");
  const [promoMessage, setPromoMessage] = useState("");
  const [upgradeModal, setUpgradeModal] = useState<string | null>(null);
  const isAuthenticated = !userLoading && user !== null;

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      setSub({ current_plan: "free", usage: { repairs_used: 0, repairs_limit: 3 } });
      return;
    }
    fetch(`${API_URL}/api/billing/subscription`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setSub)
      .catch(() => setSub({ current_plan: "free", usage: { repairs_used: 0, repairs_limit: 3 } }));
  }, [user, userLoading]);

  const usagePercent = sub
    ? sub.usage.repairs_limit === Infinity ? 0 : (sub.usage.repairs_used / sub.usage.repairs_limit) * 100
    : 0;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoStatus("applying");
    try {
      const res = await fetch(`${API_URL}/api/billing/promo/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: promoCode.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setPromoStatus("success");
        setPromoMessage(data.message || "Promo code applied successfully!");
        setPromoCode("");
        // Refresh subscription
        fetch(`${API_URL}/api/billing/subscription`, { credentials: "include" })
          .then((r) => (r.ok ? r.json() : Promise.reject()))
          .then(setSub)
          .catch(() => {});
      } else {
        const err = await res.json().catch(() => ({}));
        setPromoStatus("error");
        setPromoMessage(err.error || "Invalid or expired promo code");
      }
    } catch {
      setPromoStatus("error");
      setPromoMessage("Unable to apply promo code. Please try again.");
    }
    setTimeout(() => setPromoStatus("idle"), 4000);
  };

  const handleUpgrade = (planName: string) => {
    setUpgradeModal(planName);
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-xl font-semibold">Billing</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
          Manage your subscription, usage, and promo codes
        </p>
      </motion.div>

      {/* Usage card */}
      {sub === null ? (
        <SkeletonCard />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-[var(--border-default)] p-6 mb-6"
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

      {/* Promo Code Section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-lg border border-[var(--border-default)] p-6 mb-8"
      >
        <div className="flex items-center gap-2 mb-3">
          <Tag className="w-4 h-4 text-[var(--brand)]" />
          <h3 className="text-[15px] font-semibold">Promo Code</h3>
        </div>
        {!isAuthenticated ? (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <LogIn className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-[13px] font-medium text-amber-800">Sign in to use promo codes</p>
              <p className="text-[12px] text-amber-600 mt-0.5">You need to be logged in to apply promotional codes.</p>
            </div>
            <a
              href={`${API_URL}/auth/github`}
              className="ml-auto px-3 py-1.5 bg-[var(--brand)] text-white text-[12px] font-medium rounded-lg hover:bg-[var(--brand-hover)] transition-colors shrink-0"
            >
              Sign In
            </a>
          </div>
        ) : (
          <>
            <p className="text-[12px] text-[var(--text-secondary)] mb-4">
              Have a promo code? Enter it below to unlock discounts or plan upgrades.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code (e.g. WARPFIX50)"
                className="flex-1 px-3 py-2 text-[13px] border border-[var(--border-default)] rounded-lg bg-[var(--bg-secondary)] outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)] transition-all placeholder:text-[var(--text-tertiary)]"
                onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
              />
              <button
                onClick={handleApplyPromo}
                disabled={!promoCode.trim() || promoStatus === "applying"}
                className="px-4 py-2 bg-[var(--brand)] text-white text-[13px] font-medium rounded-lg hover:bg-[var(--brand-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                {promoStatus === "applying" ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Applying...
                  </span>
                ) : (
                  "Apply"
                )}
              </button>
            </div>
            <AnimatePresence>
              {promoStatus === "success" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 flex items-center gap-2 text-[12px] text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg"
                >
                  <Check className="w-3.5 h-3.5" />
                  {promoMessage}
                </motion.div>
              )}
              {promoStatus === "error" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 text-[12px] text-red-600 bg-red-50 px-3 py-2 rounded-lg"
                >
                  {promoMessage}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>

      {/* Plans */}
      <h2 className="text-[15px] font-semibold mb-4">Available Plans</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map((plan, i) => {
          const isCurrent = sub?.current_plan === plan.name.toLowerCase();
          return (
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
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--brand)] uppercase tracking-wider mb-3">
                  <Sparkles className="w-3 h-3" />
                  Recommended
                </div>
              )}
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <div className="flex items-baseline gap-0.5 mb-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                {plan.period && <span className="text-[var(--text-secondary)] text-sm">{plan.period}</span>}
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] mb-5">{plan.description}</p>
              <button
                onClick={() => !isCurrent && handleUpgrade(plan.name)}
                disabled={isCurrent}
                className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                  isCurrent
                    ? "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-default"
                    : plan.highlighted
                      ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]"
                      : "bg-[var(--bg-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
                }`}
              >
                {isCurrent ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Current Plan
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    Upgrade
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
              <ul className="mt-5 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[13px]">
                    <Check className="w-3.5 h-3.5 text-[var(--brand)] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>

      {/* Upgrade modal */}
      <AnimatePresence>
        {upgradeModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-50"
              onClick={() => setUpgradeModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-xl border border-[var(--border-default)] z-50 p-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-[var(--brand)]" />
                <h3 className="text-lg font-bold">Upgrade to {upgradeModal}</h3>
              </div>
              <p className="text-[13px] text-[var(--text-secondary)] mb-6">
                Connect your GitHub account to complete the upgrade to the {upgradeModal} plan. You&apos;ll be redirected to set up payment.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setUpgradeModal(null)}
                  className="flex-1 py-2.5 rounded-lg text-[13px] font-medium border border-[var(--border-default)] hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  Cancel
                </button>
                <a
                  href={`${API_URL}/auth/github?upgrade=${upgradeModal.toLowerCase()}`}
                  className="flex-1 py-2.5 rounded-lg text-[13px] font-medium bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] transition-colors text-center flex items-center justify-center gap-1.5"
                >
                  Continue
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
