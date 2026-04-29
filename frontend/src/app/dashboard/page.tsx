"use client";

import { StatsCards } from "@/components/stats-cards";
import { RecentRepairs } from "@/components/recent-repairs";
import { motion } from "framer-motion";

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

      <div className="mt-8">
        <h2 className="text-[15px] font-semibold mb-4">Recent Repairs</h2>
        <RecentRepairs />
      </div>
    </div>
  );
}
