import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatConfidence(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "High", color: "text-emerald-600 bg-emerald-50" };
  if (score >= 50) return { label: "Medium", color: "text-amber-600 bg-amber-50" };
  return { label: "Low", color: "text-red-600 bg-red-50" };
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.warpfix.org";
