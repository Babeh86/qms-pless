import * as React from "react";
import { cn } from "@/lib/utils/cn";

/* ═══════════════ Page Header ═══════════════ */

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      {breadcrumb}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-ink-900">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm text-ink-500">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1.5">
          {i > 0 ? (
            <span className="text-ink-300" aria-hidden="true">
              /
            </span>
          ) : null}
          {item.href ? (
            <a
              href={item.href}
              className="text-ink-500 transition-colors hover:text-brand-600"
            >
              {item.label}
            </a>
          ) : (
            <span className="font-medium text-ink-700">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/* ═══════════════ Table ═══════════════ */

export function TableWrap({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("scrollbar-thin overflow-x-auto", className)}>
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-ink-200 bg-ink-50/80 px-4 py-2.5 text-[11px] font-semibold tracking-wide text-ink-500 uppercase",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  colSpan,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
  align?: "left" | "right" | "center";
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "border-b border-ink-100 px-4 py-3 align-middle text-ink-700",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({
  children,
  className,
  onClick,
  onKeyDown,
  role,
  tabIndex,
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLTableRowElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTableRowElement>) => void;
  role?: React.AriaRole;
  tabIndex?: number;
  ariaLabel?: string;
}) {
  return (
    <tr
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={role}
      tabIndex={tabIndex}
      aria-label={ariaLabel}
      className={cn(
        "transition-colors duration-100 hover:bg-ink-50/70",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </tr>
  );
}

/* ═══════════════ Empty State ═══════════════ */

export function EmptyState({
  title,
  description,
  icon,
  action,
  message,
}: {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  /** Alias kompatibilitas: dipakai sebagai `title`. */
  message?: string;
}) {
  const heading = title ?? message ?? "";

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {icon ? (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
          {icon}
        </span>
      ) : null}
      <div>
        <p className="text-sm font-semibold text-ink-800">{heading}</p>
        {description ? <p className="mt-1 text-xs text-ink-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/* ═══════════════ Skeleton ═══════════════ */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("shimmer relative rounded-md bg-ink-200/70", className)}>
      <span className="shimmer-bar" aria-hidden="true" />
    </div>
  );
}
