import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  style?: React.CSSProperties;
}

export function Skeleton({ className, variant = "rectangular", style }: SkeletonProps) {
  return (
    <div
      style={style}
      className={cn(
        "shimmer",
        variant === "text" && "h-4 rounded",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded-lg",
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-secondary)] p-5">
      <Skeleton className="h-3 w-24 mb-3" variant="text" />
      <Skeleton className="h-8 w-16 mb-2" variant="text" />
      <Skeleton className="h-3 w-32" variant="text" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-lg border border-[var(--border-default)] bg-white overflow-hidden">
      <div className="border-b border-[var(--border-default)] px-5 py-3 flex gap-8">
        {[80, 160, 100, 80, 60].map((w, i) => (
          <Skeleton key={i} className="h-3" style={{ width: w }} variant="text" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-[var(--border-default)] last:border-0 px-5 py-4 flex gap-8">
          {[80, 160, 100, 80, 60].map((w, j) => (
            <Skeleton key={j} className="h-3" style={{ width: w }} variant="text" />
          ))}
        </div>
      ))}
    </div>
  );
}
