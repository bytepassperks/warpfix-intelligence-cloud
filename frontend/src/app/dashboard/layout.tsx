"use client";

import { Sidebar } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[var(--bg-secondary)]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main id="main-content" className="flex-1 p-6 lg:p-8 max-w-[1400px]">{children}</main>
      </div>
    </div>
  );
}
