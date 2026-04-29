"use client";

import { StatsCards } from "@/components/stats-cards";
import { RecentRepairs } from "@/components/recent-repairs";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export default function DashboardPage() {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Dashboard</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
          Overview of your repair activity and CI health
        </p>
      </motion.div>

      <StatsCards />

      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-[var(--text-tertiary)]" />
          <h2 className="text-[15px] font-semibold">Recent Repairs</h2>
        </div>
        <RecentRepairs />
      </div>
    </div>
  );
}
