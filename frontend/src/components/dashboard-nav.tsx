"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_SECTIONS = [
  {
    title: "Main",
    items: [
      { href: "/dashboard", label: "Overview" },
      { href: "/dashboard/repairs", label: "Repairs" },
      { href: "/dashboard/reviews", label: "Reviews" },
    ],
  },
  {
    title: "Analytics",
    items: [
      { href: "/dashboard/quality", label: "Quality" },
      { href: "/dashboard/time-saved", label: "Time Saved" },
      { href: "/dashboard/trends", label: "Trends" },
      { href: "/dashboard/security", label: "Security" },
      { href: "/dashboard/tech-debt", label: "Tech Debt" },
      { href: "/dashboard/predictions", label: "CI Predictions" },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { href: "/dashboard/knowledge", label: "Knowledge" },
      { href: "/dashboard/stability", label: "Stability" },
      { href: "/dashboard/telemetry", label: "Telemetry" },
    ],
  },
  {
    title: "Settings",
    items: [
      { href: "/dashboard/learnings", label: "Learnings" },
      { href: "/dashboard/settings", label: "Config" },
      { href: "/dashboard/billing", label: "Billing" },
    ],
  },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-card min-h-screen p-4 hidden md:block overflow-y-auto">
      <Link href="/" className="flex items-center gap-2 mb-6 px-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">W</span>
        </div>
        <span className="font-bold">WarpFix</span>
      </Link>
      {NAV_SECTIONS.map((section) => (
        <div key={section.title} className="mb-4">
          <div className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {section.title}
          </div>
          <nav className="space-y-0.5 mt-1">
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
      <div className="mt-4 p-3 bg-muted rounded-lg">
        <div className="text-xs text-muted-foreground mb-1">Quick Command</div>
        <code className="text-xs text-primary font-mono">/fix-ci</code>
      </div>
    </aside>
  );
}
