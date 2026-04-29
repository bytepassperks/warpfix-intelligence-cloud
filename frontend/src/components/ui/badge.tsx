import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "brand";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: "sm" | "md";
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]",
  success: "bg-[var(--success-bg)] text-[var(--success-text)]",
  warning: "bg-[var(--warning-bg)] text-[var(--warning-text)]",
  error: "bg-[var(--error-bg)] text-[var(--error-text)]",
  info: "bg-[var(--info-bg)] text-[var(--info)]",
  brand: "bg-[var(--brand-muted)] text-[var(--brand-text)]",
};

export function Badge({ children, variant = "default", className, size = "sm" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-xs",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function ConfidenceBadge({ score }: { score: number }) {
  const variant = score >= 80 ? "success" : score >= 50 ? "warning" : "error";
  return (
    <Badge variant={variant} size="md">
      {score}/100
    </Badge>
  );
}

export function RiskBadge({ level }: { level: string }) {
  const variant = level === "critical" ? "error" : level === "high" ? "warning" : level === "medium" ? "info" : "success";
  return (
    <Badge variant={variant} size="md">
      {level}
    </Badge>
  );
}

export function FingerprintBadge({ hash, reuses }: { hash: string; reuses: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-mono rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />
      {hash.slice(0, 8)}
      {reuses > 0 && <span className="text-[var(--text-tertiary)]">&times;{reuses}</span>}
    </span>
  );
}
