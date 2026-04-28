import { TelemetryView } from "@/components/telemetry-view";

export default function TelemetryPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Telemetry</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Detailed metrics and logs from the repair pipeline
        </p>
      </div>
      <TelemetryView />
    </div>
  );
}
