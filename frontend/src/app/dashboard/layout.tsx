"use client";

import { Sidebar } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav";
import { UserProvider } from "@/lib/user-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <div className="flex min-h-screen bg-[var(--bg-secondary)]">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav />
          <main id="main-content" className="flex-1 p-5 lg:p-8 max-w-[1200px]">{children}</main>
        </div>
      </div>
    </UserProvider>
  );
}
