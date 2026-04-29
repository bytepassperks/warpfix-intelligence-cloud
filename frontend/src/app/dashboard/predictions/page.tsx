"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://warpfix-api.onrender.com";

export default function PredictionsPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch(`${API}/api/analytics/predictions`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {});
  }, []);

  const total = (data?.total_predictions || 0) as number;
  const accuracy = (data?.accuracy_percentage || 0) as number;
  const recent = (data?.recent_predictions || []) as Array<Record<string, unknown>>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">CI Failure Predictions</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        WarpFix predicts whether your CI will pass or fail BEFORE it runs, based on code patterns, dependency analysis, and historical data.
        <br /><span className="text-primary font-medium">No competitor offers this feature.</span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <div className="text-sm text-muted-foreground">Total Predictions</div>
          <div className="text-4xl font-bold mt-2">{total}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <div className="text-sm text-muted-foreground">Accuracy</div>
          <div className="text-4xl font-bold mt-2 text-primary">{accuracy}%</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <div className="text-sm text-muted-foreground">CI Runs Saved</div>
          <div className="text-4xl font-bold mt-2 text-green-500">
            {Math.round(total * accuracy * 0.01 * 0.3)}
          </div>
          <div className="text-xs text-muted-foreground">by catching failures early</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h3 className="font-semibold mb-4">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-muted rounded-lg">
            <div className="font-medium mb-1">1. Pattern Analysis</div>
            <div className="text-muted-foreground">Checks if changed files have historically caused CI failures</div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="font-medium mb-1">2. Impact Analysis</div>
            <div className="text-muted-foreground">Uses codegraph to check blast radius and missing test updates</div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="font-medium mb-1">3. LLM Analysis</div>
            <div className="text-muted-foreground">AI examines the diff for common failure patterns</div>
          </div>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-muted font-semibold text-sm">Recent Predictions</div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left">PR</th>
                <th className="px-4 py-2 text-left">Prediction</th>
                <th className="px-4 py-2 text-left">Actual</th>
                <th className="px-4 py-2 text-left">Correct?</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((p, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-2">#{p.pr_number as number}</td>
                  <td className="px-4 py-2">{p.predicted as string}</td>
                  <td className="px-4 py-2">{p.actual as string}</td>
                  <td className="px-4 py-2">
                    <span className={p.was_correct ? "text-green-500" : "text-red-500"}>
                      {p.was_correct ? "Yes" : "No"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
