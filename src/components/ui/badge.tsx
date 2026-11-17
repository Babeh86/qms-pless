import { cn } from "@/lib/utils/cn";

type Tone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "violet"
  | "dark"
  /* ── alias kompatibilitas (nama lama) ── */
  | "blue"
  | "green"
  | "red"
  | "amber"
  | "purple"
  | "slate";

const TONES: Record<string, string> = {
  neutral: "bg-ink-100 text-ink-700 ring-ink-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  success: "bg-success-50 text-success-700 ring-success-500/20",
  warning: "bg-warning-50 text-warning-700 ring-warning-500/20",
  danger: "bg-danger-50 text-danger-700 ring-danger-500/20",
  info: "bg-info-50 text-info-600 ring-info-500/20",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  dark: "bg-ink-800 text-white ring-ink-700",
  /* alias */
  blue: "bg-brand-50 text-brand-700 ring-brand-200",
  green: "bg-success-50 text-success-700 ring-success-500/20",
  red: "bg-danger-50 text-danger-700 ring-danger-500/20",
  amber: "bg-warning-50 text-warning-700 ring-warning-500/20",
  purple: "bg-violet-50 text-violet-700 ring-violet-200",
  slate: "bg-ink-800 text-white ring-ink-700",
};

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

/* ── Pemetaan domain → tone ── */

export function roleTone(role: string): Tone {
  switch (role) {
    case "COMPANY":
      return "dark";
    case "SUPPLIER":
      return "brand";
    case "CUSTOMER":
      return "violet";
    default:
      return "neutral";
  }
}

export function statusTone(status: string): Tone {
  switch (status) {
    case "DRAFT":
      return "neutral";
    case "SUBMITTED":
      return "warning";
    case "CHECKED":
      return "info";
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "danger";
    case "ARCHIVED":
      return "dark";
    default:
      return "neutral";
  }
}

export function judgmentTone(j: "OK" | "NG" | null): Tone {
  if (j === "OK") return "success";
  if (j === "NG") return "danger";
  return "neutral";
}

export function machineTypeTone(type: string): Tone {
  switch (type) {
    case "INJECTION_HORIZONTAL":
      return "brand";
    case "INJECTION_VERTICAL":
      return "violet";
    case "PRESS":
      return "warning";
    default:
      return "neutral";
  }
}
