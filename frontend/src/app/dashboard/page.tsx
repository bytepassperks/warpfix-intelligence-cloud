"use client";

import { StatsCards } from "@/components/stats-cards";
import { RecentRepairs } from "@/components/recent-repairs";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">Dashboard</h1>
        <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
          Overview of your repair activity and CI health
        </p>
      </motion.div>

      <StatsCards />

      {/* Upgrade Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl border border-indigo-100 p-5 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--brand-muted)] flex items-center justify-center">
            <Zap className="w-5 h-5 text-[var(--brand)]" />
          </div>
          <div>
            <div className="text-[14px] font-semibold text-[var(--text-primary)]">
              Unlock unlimited repairs
            </div>
            <div className="text-[12px] text-[var(--text-secondary)]">
              Upgrade to Pro for unlimited repairs, sandbox validation, and priority support.
            </div>
          </div>
        </div>
        <Link
          href="/dashboard/billing"
          className="flex items-center gap-1.5 px-4 py-2 bg-[var(--brand)] text-white text-[13px] font-medium rounded-lg hover:bg-[var(--brand-hover)] transition-colors shrink-0"
        >
          Upgrade
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </motion.div>

      <div className="mt-8">
        <h2 className="text-[15px] font-semibold mb-4">Recent Repairs</h2>
        <RecentRepairs />
      </div>
    </div>
  );
}
