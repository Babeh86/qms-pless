"use client";

import { useTranslations } from "next-intl";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Input } from "@/components/ui/input";

/* ═══════════════ Tabs ═══════════════ */

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (key: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn("flex gap-1 overflow-x-auto rounded-lg bg-ink-100 p-1", className)}
    >
      {items.map((item) => (
        <button
          key={item.key}
          role="tab"
          type="button"
          aria-selected={value === item.key}
          onClick={() => onChange(item.key)}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all duration-150",
            value === item.key ? "bg-white text-ink-900 shadow-xs" : "text-ink-500 hover:text-ink-800",
          )}
        >
          {item.label}
          {typeof item.count === "number" ? (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] tabular",
                value === item.key ? "bg-brand-50 text-brand-700" : "bg-ink-200/70 text-ink-600",
              )}
            >
              {item.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════ Segmented ═══════════════ */

export function Segmented<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-ink-300 bg-white p-0.5 shadow-xs">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          aria-pressed={value === item.key}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === item.key
              ? "bg-ink-900 text-white"
              : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════ Search ═══════════════ */

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) {
  const t = useTranslations("lit");

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-ink-400"
        aria-hidden="true"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pr-8 pl-8.5"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label={t("clear")}
          className="absolute top-1/2 right-2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
}

/* ═══════════════ Toolbar ═══════════════ */

export function Toolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2.5 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  const t = useTranslations("lit");

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-700 ring-1 ring-brand-200 ring-inset">
      <SlidersHorizontal className="h-3 w-3" aria-hidden="true" />
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`${t("clear")} ${label}`}
        className="ml-0.5 rounded hover:bg-brand-100"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

/* ═══════════════ Pagination ═══════════════ */

export function Pagination({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const t = useTranslations("lit");

  if (totalPages <= 1) {
    return <p className="text-xs text-ink-500">{total}</p>;
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-ink-500">{t("pageInfo", { page, totalPages, total })}</p>
      <div className="flex gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="rounded-md border border-ink-300 px-2.5 py-1 text-xs font-medium text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-40"
        >
          {t("prev")}
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="rounded-md border border-ink-300 px-2.5 py-1 text-xs font-medium text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-40"
        >
          {t("nextPage")}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════ Progress ═══════════════ */

export function ProgressBar({
  value,
  max,
  tone = "brand",
  showLabel = true,
}: {
  value: number;
  max: number;
  tone?: "brand" | "success" | "warning" | "danger";
  showLabel?: boolean;
}) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  const bar = {
    brand: "bg-brand-500",
    success: "bg-success-500",
    warning: "bg-warning-500",
    danger: "bg-danger-500",
  }[tone];

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-200">
        <div
          className={cn("h-full rounded-full transition-all duration-300", bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel ? (
        <span className="w-9 text-right text-[11px] font-semibold text-ink-600 tabular">{pct}%</span>
      ) : null}
    </div>
  );
}
