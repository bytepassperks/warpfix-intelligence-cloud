"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, HelpCircle, User, ChevronDown, Settings, CreditCard, LogOut, X, ExternalLink } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SEARCH_ITEMS = [
  { label: "Dashboard", href: "/dashboard", category: "Pages" },
  { label: "Repositories", href: "/dashboard/repositories", category: "Pages" },
  { label: "Repairs", href: "/dashboard/repairs", category: "Pages" },
  { label: "Reviews", href: "/dashboard/reviews", category: "Pages" },
  { label: "Analytics", href: "/dashboard/analytics", category: "Pages" },
  { label: "Security", href: "/dashboard/security", category: "Pages" },
  { label: "Dependency Radar", href: "/dashboard/dependency-radar", category: "Pages" },
  { label: "Settings", href: "/dashboard/settings", category: "Pages" },
  { label: "Billing", href: "/dashboard/billing", category: "Pages" },
];

const NOTIFICATIONS = [
  { id: 1, title: "CI repair completed", desc: "PR #42 — fixed test timeout in auth module", time: "2 min ago", unread: true },
  { id: 2, title: "New review posted", desc: "PR #41 — 3 issues found in api/users.ts", time: "15 min ago", unread: true },
  { id: 3, title: "Fingerprint match", desc: "Reused fix from PR #38 for similar error", time: "1 hour ago", unread: false },
  { id: 4, title: "Security scan complete", desc: "No vulnerabilities detected in latest scan", time: "3 hours ago", unread: false },
];

export function TopNav() {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = NOTIFICATIONS.filter((n) => n.unread).length;

  const filteredItems = searchQuery.trim()
    ? SEARCH_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SEARCH_ITEMS;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "/" && !searchOpen && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [searchOpen]);

  return (
    <header className="h-14 border-b border-[var(--border-default)] bg-white flex items-center px-4 gap-3 shrink-0 z-40">
      {/* Breadcrumb area */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="text-sm text-[var(--text-secondary)]">Dashboard</span>
      </div>

      {/* Search trigger */}
      <button
        onClick={() => setSearchOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-tertiary)] border border-[var(--border-default)] rounded-lg hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)] transition-colors bg-[var(--bg-secondary)]"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-[var(--bg-tertiary)] rounded">
          /
        </kbd>
      </button>

      {/* Docs link */}
      <a
        href="https://docs.warpfix.dev"
        target="_blank"
        rel="noopener"
        className="p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
        title="Documentation"
      >
        <HelpCircle className="w-4 h-4" />
      </a>

      {/* Notifications */}
      <div ref={notifRef} className="relative">
        <button
          onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
          className="relative p-2 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-1 w-80 bg-white rounded-lg shadow-lg border border-[var(--border-default)] overflow-hidden z-50"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
                <span className="text-[13px] font-semibold">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[11px] text-[var(--brand)] font-medium">{unreadCount} new</span>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {NOTIFICATIONS.map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 border-b border-[var(--border-default)] last:border-0 hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors ${
                      notif.unread ? "bg-[var(--brand-muted)]/30" : ""
                    }`}
                    onClick={() => setNotifOpen(false)}
                  >
                    <div className="flex items-start gap-2">
                      {notif.unread && <span className="w-1.5 h-1.5 bg-[var(--brand)] rounded-full mt-1.5 shrink-0" />}
                      <div className={notif.unread ? "" : "ml-3.5"}>
                        <div className="text-[13px] font-medium">{notif.title}</div>
                        <div className="text-[12px] text-[var(--text-secondary)] mt-0.5">{notif.desc}</div>
                        <div className="text-[11px] text-[var(--text-tertiary)] mt-1">{notif.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-[var(--border-default)] text-center">
                <button className="text-[12px] text-[var(--brand)] font-medium hover:underline">
                  Mark all as read
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User menu */}
      <div ref={profileRef} className="relative">
        <button
          onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-[var(--brand-muted)] flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-[var(--brand)]" />
          </div>
          <ChevronDown className={`w-3 h-3 text-[var(--text-tertiary)] transition-transform ${profileOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-[var(--border-default)] overflow-hidden z-50"
            >
              {/* User info */}
              <div className="px-4 py-3 border-b border-[var(--border-default)]">
                <div className="text-[13px] font-semibold text-[var(--text-primary)]">Harry Roger</div>
                <div className="text-[12px] text-[var(--text-secondary)]">harryroger798@gmail.com</div>
                <div className="mt-1.5 inline-flex items-center px-1.5 py-0.5 bg-[var(--brand-muted)] text-[var(--brand)] text-[10px] font-semibold rounded uppercase">
                  Free Plan
                </div>
              </div>
              {/* Menu items */}
              <div className="py-1">
                <Link
                  href="/dashboard/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Settings
                </Link>
                <Link
                  href="/dashboard/billing"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Billing & Plans
                </Link>
                <a
                  href="https://docs.warpfix.dev"
                  target="_blank"
                  rel="noopener"
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Documentation
                </a>
              </div>
              <div className="border-t border-[var(--border-default)] py-1">
                <button
                  onClick={() => { setProfileOpen(false); router.push("/"); }}
                  className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-50"
              onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pages, repairs, repositories..."
                  className="flex-1 text-sm bg-transparent outline-none placeholder:text-[var(--text-tertiary)]"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); }
                    if (e.key === "Enter" && filteredItems.length > 0) {
                      router.push(filteredItems[0].href);
                      setSearchOpen(false);
                      setSearchQuery("");
                    }
                  }}
                />
                <button
                  onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                  className="p-1 rounded hover:bg-[var(--bg-secondary)]"
                >
                  <X className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredItems.length === 0 ? (
                  <div className="p-4 text-xs text-[var(--text-tertiary)] text-center">
                    No results for &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  <div className="p-2">
                    <div className="px-2 py-1 text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                      Pages
                    </div>
                    {filteredItems.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => {
                          router.push(item.href);
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors text-left"
                      >
                        <Search className="w-3 h-3 text-[var(--text-tertiary)]" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-4 py-2 border-t border-[var(--border-default)] flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
                <span><kbd className="px-1 py-0.5 bg-[var(--bg-tertiary)] rounded text-[10px]">↵</kbd> to select</span>
                <span><kbd className="px-1 py-0.5 bg-[var(--bg-tertiary)] rounded text-[10px]">esc</kbd> to close</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
