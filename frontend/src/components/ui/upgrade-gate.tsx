"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import Link from "next/link";

interface UpgradeGateProps {
  feature: string;
  requiredPlan: string;
  currentPlan: string;
}

export function UpgradeGate({ feature, requiredPlan, currentPlan }: UpgradeGateProps) {
  const planLabel = requiredPlan === "team" ? "Team" : "Pro";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-lg border border-dashed border-amber-200 bg-amber-50/50"
    >
      <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center mb-5">
        <Lock className="w-7 h-7 text-amber-600" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {planLabel} Plan Feature
      </h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-md mb-6">
        This feature requires the <strong>{planLabel}</strong> plan.
        You&apos;re currently on the <strong className="capitalize">{currentPlan}</strong> plan.
        Upgrade to unlock this and other advanced features.
      </p>
      <Link
        href="/dashboard/billing"
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] transition-colors"
      >
        Upgrade to {planLabel}
      </Link>
    </motion.div>
  );
}
