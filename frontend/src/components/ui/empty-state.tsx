"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        "rounded-lg border border-dashed border-[var(--border-default)] bg-[var(--bg-secondary)]",
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-[var(--brand-muted)] flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-[var(--brand)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-5">{description}</p>
      {action && (
        action.href ? (
          <a
            href={action.href}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] transition-colors"
          >
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] transition-colors"
          >
            {action.label}
          </button>
        )
      )}
    </motion.div>
  );
}
