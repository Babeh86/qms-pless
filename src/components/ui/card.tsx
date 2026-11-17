import * as React from "react";
import { cn } from "@/lib/utils/cn";

/* ═══════════════ Card ═══════════════ */

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-ink-200 bg-white shadow-sm",
        "transition-shadow duration-200",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-sm font-semibold tracking-tight text-ink-900", className)} {...props} />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-0.5 text-xs text-ink-500", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-t border-ink-100 bg-ink-50/60 px-5 py-3",
        className,
      )}
      {...props}
    />
  );
}

/* ═══════════════ Stat Card ═══════════════ */

type StatTone = "brand" | "success" | "warning" | "danger" | "neutral";

const STAT_TONES: Record<StatTone, { icon: string; value: string; bar: string }> = {
  brand: { icon: "bg-brand-50 text-brand-600", value: "text-ink-900", bar: "bg-brand-500" },
  success: {
    icon: "bg-success-50 text-success-600",
    value: "text-ink-900",
    bar: "bg-success-500",
  },
  warning: {
    icon: "bg-warning-50 text-warning-600",
    value: "text-ink-900",
    bar: "bg-warning-500",
  },
  danger: { icon: "bg-danger-50 text-danger-600", value: "text-ink-900", bar: "bg-danger-500" },
  neutral: { icon: "bg-ink-100 text-ink-600", value: "text-ink-900", bar: "bg-ink-400" },
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "brand",
  trend,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  tone?: StatTone;
  trend?: { value: string; positive?: boolean };
}) {
  const t = STAT_TONES[tone];

  return (
    <div className="group relative overflow-hidden rounded-xl border border-ink-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-ink-500">{label}</p>
          <p className={cn("mt-2 text-2xl font-bold tracking-tight tabular", t.value)}>{value}</p>
          {hint ? <p className="mt-1 truncate text-xs text-ink-400">{hint}</p> : null}
        </div>
        {icon ? (
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              t.icon,
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>

      {trend ? (
        <p
          className={cn(
            "mt-3 inline-flex items-center gap-1 text-xs font-medium",
            trend.positive ? "text-success-600" : "text-danger-600",
          )}
        >
          {trend.value}
        </p>
      ) : null}

      <span
        className={cn(
          "absolute inset-x-0 bottom-0 h-0.5 scale-x-0 transition-transform duration-300 group-hover:scale-x-100",
          t.bar,
        )}
      />
    </div>
  );
}
