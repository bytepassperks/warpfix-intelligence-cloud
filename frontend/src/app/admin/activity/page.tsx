"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "../layout";
import { Clock } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.warpfix.org";

interface Activity {
  id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export default function ActivityPage() {
  const { token } = useAdmin();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/admin/activity`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setActivities(data.activity || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[var(--text-tertiary)]">Recent admin actions and system events</p>

      <div className="bg-white rounded-xl border border-[var(--border-default)]">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-100 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-3" />
            <p className="text-[14px] font-medium text-[var(--text-secondary)]">No activity yet</p>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-1">Admin actions will appear here as they happen.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border-default)]">
            {activities.map((a) => (
              <div key={a.id} className="px-5 py-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--brand)]/8 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--brand)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px]">
                    <span className="font-medium">{a.admin_email}</span>{" "}
                    <span className="text-[var(--text-secondary)]">{a.action}</span>
                    {a.target_type && <span className="text-[var(--text-tertiary)]"> on {a.target_type}</span>}
                  </p>
                  {a.details && (
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 font-mono truncate">
                      {JSON.stringify(a.details)}
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-[var(--text-tertiary)] whitespace-nowrap shrink-0">
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
