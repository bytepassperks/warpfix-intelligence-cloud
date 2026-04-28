import { RecentRepairs } from "@/components/recent-repairs";

export default function RepairsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Repair History</h1>
        <p className="text-muted-foreground text-sm mt-1">
          All repairs performed by WarpFix across your repositories
        </p>
      </div>
      <RecentRepairs />
    </div>
  );
}
