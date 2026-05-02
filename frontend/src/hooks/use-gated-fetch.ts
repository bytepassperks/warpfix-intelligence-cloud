"use client";

import { useState, useEffect } from "react";
import { API_URL } from "@/lib/utils";

interface GateInfo {
  feature: string;
  currentPlan: string;
  requiredPlan: string;
}

interface GatedFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  gated: GateInfo | null;
}

export function useGatedFetch<T>(path: string): GatedFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gated, setGated] = useState<GateInfo | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${API_URL}${path}`, { credentials: "include" });
        if (res.status === 403) {
          const body = await res.json();
          if (body.feature) {
            setGated({
              feature: body.feature,
              currentPlan: body.current_plan || "free",
              requiredPlan: body.required_plan || "pro",
            });
            return;
          }
          throw new Error(body.error || "Access denied");
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [path]);

  return { data, loading, error, gated };
}
