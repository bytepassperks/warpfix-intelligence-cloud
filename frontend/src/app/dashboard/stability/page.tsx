import { StabilityChart } from "@/components/stability-chart";

export default function StabilityPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">CI Stability</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your CI health over time and monitor dependency drift
        </p>
      </div>
      <StabilityChart />
    </div>
  );
}
