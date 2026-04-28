"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/repairs", label: "Repairs" },
  { href: "/dashboard/stability", label: "Stability" },
  { href: "/dashboard/telemetry", label: "Telemetry" },
  { href: "/dashboard/billing", label: "Billing" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-card min-h-screen p-4 hidden md:block">
      <Link href="/" className="flex items-center gap-2 mb-8 px-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">W</span>
        </div>
        <span className="font-bold">WarpFix</span>
      </Link>
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
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
      <div className="mt-8 p-3 bg-muted rounded-lg">
        <div className="text-xs text-muted-foreground mb-1">Quick Command</div>
        <code className="text-xs text-primary font-mono">/fix-ci</code>
      </div>
    </aside>
  );
}
