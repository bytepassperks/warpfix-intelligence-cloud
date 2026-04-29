"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FolderGit2,
  Wrench,
  MessageSquareText,
  BarChart3,
  Shield,
  Radar,
  Settings,
  CreditCard,
  PanelLeftClose,
  PanelLeft,
  Terminal,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/repositories", label: "Repositories", icon: FolderGit2 },
    ],
  },
  {
    title: "Activity",
    items: [
      { href: "/dashboard/repairs", label: "Repairs", icon: Wrench },
      { href: "/dashboard/reviews", label: "Reviews", icon: MessageSquareText },
    ],
  },
  {
    title: "Insights",
    items: [
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/dashboard/security", label: "Security", icon: Shield },
      { href: "/dashboard/dependency-radar", label: "Dependency Radar", icon: Radar },
    ],
  },
  {
    title: "Configure",
    items: [
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
      { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 52 : 256 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="border-r border-[var(--border-default)] bg-white flex-col h-screen sticky top-0 overflow-hidden z-30 hidden md:flex"
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-3 border-b border-[var(--border-default)] shrink-0">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-[var(--brand)] flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="font-semibold text-[15px] text-[var(--text-primary)] whitespace-nowrap overflow-hidden"
              >
                WarpFix
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-2 mb-1 text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider"
                >
                  {section.title}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all duration-150",
                      collapsed && "justify-center px-0",
                      isActive
                        ? "bg-[var(--brand-muted)] text-[var(--brand-text)] font-medium"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", isActive && "text-[var(--brand)]")} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="whitespace-nowrap overflow-hidden"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Quick command hint */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-3 mb-3 p-3 rounded-lg bg-[var(--bg-inverse)] text-white"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Terminal className="w-3.5 h-3.5 text-[var(--brand)]" />
              <span className="text-[11px] font-medium text-gray-400">Quick Command</span>
            </div>
            <code className="text-xs font-mono text-[var(--brand)]">/fix-ci</code>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="h-10 flex items-center justify-center border-t border-[var(--border-default)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
      >
        {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
}
