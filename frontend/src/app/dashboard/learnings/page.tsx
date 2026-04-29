"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://warpfix-api.onrender.com";

interface Learning {
  id: string;
  rule: string;
  category: string;
  context: string;
  source: string;
  active: boolean;
  times_applied: number;
  repo_name: string;
  created_at: string;
}

export default function LearningsPage() {
  const [learnings, setLearnings] = useState<Learning[]>([]);
  const [newRule, setNewRule] = useState("");
  const [newCategory, setNewCategory] = useState("general");

  useEffect(() => {
    fetch(`${API}/api/learnings/public`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setLearnings(d.learnings || []); })
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Learnings Manager</h1>

      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <h3 className="font-semibold mb-3">Add New Learning</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Learnings are reusable rules that improve future reviews. Example: &quot;Always use parameterized queries in this repo&quot;
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            placeholder="Enter a rule, e.g. 'Never use console.log in production code'"
            className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm"
          />
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-muted border border-border text-sm"
          >
            <option value="general">General</option>
            <option value="security">Security</option>
            <option value="performance">Performance</option>
            <option value="style">Style</option>
            <option value="testing">Testing</option>
            <option value="architecture">Architecture</option>
          </select>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90">
            Add
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-3 text-left">Rule</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-left">Applied</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {learnings.map((l) => (
              <tr key={l.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3 max-w-md">
                  <div className="truncate">{l.rule}</div>
                  {l.context && <div className="text-xs text-muted-foreground mt-0.5">{l.context}</div>}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 bg-muted rounded text-xs">{l.category}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{l.source}</td>
                <td className="px-4 py-3">{l.times_applied}x</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${l.active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                    {l.active ? "Active" : "Disabled"}
                  </span>
                </td>
              </tr>
            ))}
            {learnings.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No learnings yet. They are created from developer feedback on PR reviews, or you can add them manually above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
