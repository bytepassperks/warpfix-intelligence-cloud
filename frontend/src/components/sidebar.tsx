"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
  return (
    <aside className="border-r border-[var(--border-default)] bg-white flex-col h-screen sticky top-0 overflow-hidden z-30 hidden md:flex w-[256px]">
      {/* Logo */}
      <div className="h-14 flex items-center px-3 border-b border-[var(--border-default)] shrink-0">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <Image src="/logo-warpfix.png" alt="WarpFix" width={32} height={32} className="shrink-0" />
          <span className="font-semibold text-[15px] text-[var(--text-primary)] whitespace-nowrap">
            WarpFix
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            <div className="px-2 mb-1 text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-all duration-150",
                      isActive
                        ? "bg-[var(--brand-muted)] text-[var(--brand-text)] font-medium"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", isActive && "text-[var(--brand)]")} />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
