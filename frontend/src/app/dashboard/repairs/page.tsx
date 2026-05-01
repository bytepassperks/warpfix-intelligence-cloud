"use client";

import { RecentRepairs } from "@/components/recent-repairs";
import { motion } from "framer-motion";

export default function RepairsPage() {
  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-xl font-semibold">Repair History</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
          All repairs performed by WarpFix across your repositories
        </p>
      </motion.div>
      <RecentRepairs />
    </div>
  );
}
