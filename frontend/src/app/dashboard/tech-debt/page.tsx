"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://warpfix-api.onrender.com";

export default function TechDebtPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`${API}/api/analytics/tech-debt`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {});
  }, []);

  const currentScore = (data?.current_score || {}) as Record<string, unknown>;
  const trend = (data?.trend || 0) as number;

  const grade = (currentScore?.overall_grade || "N/A") as string;
  const score = (currentScore?.overall_score || 0) as number;
  const distribution = (currentScore?.grade_distribution || { A: 0, B: 0, C: 0, D: 0, F: 0 }) as Record<string, number>;
  const worstFiles = (currentScore?.worst_files || []) as Array<Record<string, unknown>>;

  const gradeColor = (g: string) => {
    switch (g) {
      case "A": return "text-green-500";
      case "B": return "text-blue-500";
      case "C": return "text-yellow-500";
      case "D": return "text-orange-500";
      case "F": return "text-red-500";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Technical Debt Tracker</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <div className="text-sm text-muted-foreground">Overall Grade</div>
          <div className={`text-6xl font-bold mt-2 ${gradeColor(grade)}`}>{grade}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <div className="text-sm text-muted-foreground">Debt Score</div>
          <div className="text-4xl font-bold mt-2">{score}/100</div>
          <div className="text-xs text-muted-foreground">Lower is better</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <div className="text-sm text-muted-foreground">30-Day Trend</div>
          <div className={`text-4xl font-bold mt-2 ${trend > 0 ? "text-red-500" : trend < 0 ? "text-green-500" : ""}`}>
            {trend > 0 ? "+" : ""}{trend}
          </div>
          <div className="text-xs text-muted-foreground">{trend > 0 ? "Increasing" : trend < 0 ? "Decreasing" : "Stable"}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Grade Distribution</h3>
          <div className="space-y-2">
            {["A", "B", "C", "D", "F"].map((g) => (
              <div key={g} className="flex items-center gap-3">
                <span className={`w-6 font-bold ${gradeColor(g)}`}>{g}</span>
                <div className="flex-1 bg-muted rounded-full h-3">
                  <div className={`h-3 rounded-full ${g === "A" ? "bg-green-500" : g === "B" ? "bg-blue-500" : g === "C" ? "bg-yellow-500" : g === "D" ? "bg-orange-500" : "bg-red-500"}`}
                    style={{ width: `${Math.min((distribution[g] || 0) * 5, 100)}%` }} />
                </div>
                <span className="w-8 text-sm text-muted-foreground text-right">{distribution[g] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Debt Indicators Tracked</h3>
          <div className="space-y-2 text-sm">
            {[
              "TODO/FIXME Comments",
              "Long Functions (>50 lines)",
              "Deep Nesting (>5 levels)",
              "Magic Numbers",
              "Console Statements",
              "TypeScript `any` types",
              "Disabled Lint Rules",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {worstFiles.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-6 mt-6">
          <h3 className="font-semibold mb-4">Highest Debt Files</h3>
          <div className="space-y-2">
            {worstFiles.slice(0, 10).map((f, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs">{f.file as string}</span>
                <span className={`font-bold ${gradeColor(f.grade as string)}`}>{f.grade as string}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
