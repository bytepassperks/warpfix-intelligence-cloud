import { StatsCards } from "@/components/stats-cards";
import { RecentRepairs } from "@/components/recent-repairs";

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your repair activity and CI health
        </p>
      </div>
      <StatsCards />
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Recent Repairs</h2>
        <RecentRepairs />
      </div>
    </div>
  );
}
