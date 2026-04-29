"use client";

import Link from "next/link";
import { Search, Bell, HelpCircle, User, ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function TopNav() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="h-14 border-b border-[var(--border-default)] bg-white flex items-center px-4 gap-3 shrink-0 z-40">
      {/* Breadcrumb area */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="text-sm text-[var(--text-secondary)]">Dashboard</span>
      </div>

      {/* Search trigger */}
      <button
        onClick={() => setSearchOpen(!searchOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-tertiary)] border border-[var(--border-default)] rounded-lg hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] transition-colors bg-[var(--bg-secondary)]"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-[var(--bg-tertiary)] rounded">
          /
        </kbd>
      </button>

      {/* Quick actions */}
      <a
        href="https://docs.warpfix.dev"
        target="_blank"
        rel="noopener"
        className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
        title="Documentation"
      >
        <HelpCircle className="w-4 h-4" />
      </a>

      <button
        className="relative p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
      </button>

      {/* User menu */}
      <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
        <div className="w-7 h-7 rounded-full bg-[var(--brand-muted)] flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-[var(--brand)]" />
        </div>
        <ChevronDown className="w-3 h-3 text-[var(--text-tertiary)]" />
      </button>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-50"
              onClick={() => setSearchOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-white rounded-xl shadow-lg border border-[var(--border-default)] z-50 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-default)]">
                <Search className="w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  autoFocus
                  placeholder="Search repairs, reviews, repositories..."
                  className="flex-1 text-sm bg-transparent outline-none placeholder:text-[var(--text-tertiary)]"
                  onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                />
              </div>
              <div className="p-3 text-xs text-[var(--text-tertiary)] text-center">
                Start typing to search
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
