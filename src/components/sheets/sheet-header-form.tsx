"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Info, Lock } from "lucide-react";
import type { HeaderField } from "@/lib/mock/templates-flat";
import { businessPartners, materials, machines, parts } from "@/lib/mock/data";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

/* ═══════════════════════════════════════════════════════════════
   HEADER FORM — semua field kosong, diisi user dari master data
   ═══════════════════════════════════════════════════════════════ */

export type HeaderValues = Record<string, string>;

export const EMPTY_HEADER: HeaderValues = {};

/** Opsi dropdown per sumber data. */
export function useHeaderOptions() {
  return useMemo(() => {
    const suppliers = businessPartners
      .filter((p) => p.roles.includes("SUPPLIER") && p.isActive)
      .map((p) => ({ value: p.code, label: p.name, hint: p.code }));

    const customers = businessPartners
      .filter((p) => p.roles.includes("CUSTOMER") && p.isActive)
      .map((p) => ({ value: p.code, label: p.name, hint: p.code }));

    const materialOptions = materials
      .filter((m) => m.isActive)
      .map((m) => ({
        value: m.code,
        label: m.name,
        hint: [m.grade, m.color].filter(Boolean).join(" · "),
      }));

    const machineOptions = machines
      .filter((m) => m.isActive)
      .map((m) => ({ value: m.machineNo, label: m.machineNo, hint: m.type.replace("INJECTION_", "INJ ") }));

    const partOptions = parts
      .filter((p) => p.isActive)
      .map((p) => ({ value: p.partNo, label: p.partNo, hint: p.partName }));

    const moldOptions = Array.from(
      new Set(parts.filter((p) => p.moldCode).map((p) => p.moldCode as string)),
    ).map((code) => ({ value: code, label: code, hint: "" }));

    return { suppliers, customers, materialOptions, machineOptions, partOptions, moldOptions };
  }, []);
}

/**
 * Mengisi otomatis field DERIVED berdasarkan Part / Material / Mesin terpilih.
 * Dipanggil setiap kali user mengubah dropdown.
 */
export function deriveHeaderValues(
  values: HeaderValues,
  overrides: HeaderValues = {},
): HeaderValues {
  const next: HeaderValues = { ...values, ...overrides };

  const part = parts.find((p) => p.partNo === next.partNo);
  if (part) {
    if (!overrides.partName) next.partName = part.partName;
    if (!overrides.model && part.model) next.model = part.model;
    if (!overrides.cavity) next.cavity = String(part.defaultCavityCount);
    if (!overrides.drawingRev && part.drawingRev) next.drawingRev = part.drawingRev;
    if (!overrides.moldCode && part.moldCode) next.moldCode = part.moldCode;

    const mat = materials.find((m) => m.id === part.materialId);
    if (mat) {
      if (!overrides.material) {
        next.material = [mat.name, mat.additiveMasterbatch, mat.color]
          .filter(Boolean)
          .join(" ");
      }
      if (!overrides.color && mat.color) next.color = mat.color;
    }

    if (!overrides.supplier && part.supplierCode) next.supplier = part.supplierCode;
    if (!overrides.customer && part.customerCode) next.customer = part.customerCode;
  }

  // Material dipilih langsung (CS-03 / CS-04)
  if (next.material && !part) {
    const mat = materials.find((m) => m.code === next.material);
    if (mat) {
      next.material = [mat.name, mat.additiveMasterbatch, mat.color].filter(Boolean).join(" ");
      if (!next.color && mat.color) next.color = mat.color;
      if (!next.supplier && mat.supplierCode) next.supplier = mat.supplierCode;
    }
  }

  return next;
}

function formatValueForDisplay(field: HeaderField, raw: string): string {
  if (!raw) return "";
  if (field.source === "SUPPLIER" || field.source === "CUSTOMER") {
    return businessPartners.find((p) => p.code === raw)?.name ?? raw;
  }
  return raw;
}

export function SheetHeaderForm({
  fields,
  values,
  onChange,
  readOnly = false,
  onReset,
}: {
  fields: HeaderField[];
  values: HeaderValues;
  onChange: (next: HeaderValues) => void;
  readOnly?: boolean;
  onReset?: () => void;
}) {
  const t = useTranslations("headerForm");
  const options = useHeaderOptions();

  const filled = fields.filter((f) => (values[f.key] ?? "").trim() !== "").length;
  const requiredMissing = fields.filter(
    (f) => f.required && (values[f.key] ?? "").trim() === "",
  ).length;

  function setField(field: HeaderField, raw: string) {
    const overrides: HeaderValues = { [field.key]: raw };

    if (field.source === "PART") {
      // Reset derivatif agar ikut part baru
      const reset: HeaderValues = {
        partName: "",
        material: "",
        color: "",
        model: "",
        cavity: "",
        drawingRev: "",
        moldCode: "",
        supplier: "",
      };
      onChange(deriveHeaderValues({ ...values, ...reset }, overrides));
      return;
    }

    if (field.source === "MATERIAL") {
      onChange(deriveHeaderValues({ ...values, color: "" }, overrides));
      return;
    }

    onChange({ ...values, ...overrides });
  }

  return (
    <section
      aria-labelledby="sheet-header-title"
      className="rounded-xl border border-ink-200 bg-white shadow-sm"
    >
      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 id="sheet-header-title" className="text-[13px] font-semibold text-ink-900">
            {t("title")}
          </h2>
          <Badge tone={requiredMissing > 0 ? "warning" : "success"}>
            {t("filledCount", { filled, total: fields.length })}
          </Badge>
          {requiredMissing > 0 ? (
            <span className="text-[11px] text-warning-700">
              {t("requiredMissing", { count: requiredMissing })}
            </span>
          ) : null}
        </div>

        {onReset && !readOnly ? (
          <button
            type="button"
            onClick={onReset}
            className="rounded-md px-2 py-1 text-[11px] font-medium text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
          >
            {t("reset")}
          </button>
        ) : null}
      </div>

      {/* Grid field */}
      <div className="grid gap-x-4 gap-y-3.5 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map((field) => {
          const raw = values[field.key] ?? "";
          const isDerived = field.source === "DERIVED";
          const empty = raw.trim() === "";

          return (
            <div
              key={field.key}
              className={cn(
                "min-w-0",
                field.span === 2 && "sm:col-span-2",
                field.span === 3 && "sm:col-span-2 lg:col-span-3",
                field.span === 4 && "sm:col-span-2 lg:col-span-4",
              )}
            >
              <label
                htmlFor={`hf-${field.key}`}
                className="mb-1 flex items-center gap-1 text-[10px] font-semibold tracking-wider text-ink-400 uppercase"
              >
                {field.label}
                {field.required ? (
                  <span className="text-danger-500" aria-label={t("required")}>
                    *
                  </span>
                ) : null}
                {isDerived ? (
                  <Lock className="h-2.5 w-2.5 text-ink-300" aria-label={t("autoFilled")} />
                ) : null}
              </label>

              {isDerived ? (
                <div
                  className={cn(
                    "flex h-9.5 items-center gap-1.5 rounded-lg border border-dashed px-3 text-sm",
                    empty
                      ? "border-ink-200 bg-ink-50/60 text-ink-300"
                      : "border-ink-200 bg-ink-50 text-ink-800",
                  )}
                >
                  <span className="truncate">
                    {empty ? t("autoPlaceholder") : formatValueForDisplay(field, raw)}
                  </span>
                </div>
              ) : field.source === "PART" ||
                field.source === "SUPPLIER" ||
                field.source === "CUSTOMER" ||
                field.source === "MATERIAL" ||
                field.source === "MACHINE" ||
                field.source === "MOLD" ? (
                <Select
                  id={`hf-${field.key}`}
                  value={raw}
                  onChange={(e) => setField(field, e.target.value)}
                  disabled={readOnly}
                  aria-required={field.required}
                  className={cn(empty && field.required && "border-warning-400 bg-warning-50/40")}
                >
                  <option value="">{t("selectPlaceholder")}</option>
                  {(field.source === "PART"
                    ? options.partOptions
                    : field.source === "SUPPLIER"
                      ? options.suppliers
                      : field.source === "CUSTOMER"
                        ? options.customers
                        : field.source === "MATERIAL"
                          ? options.materialOptions
                          : field.source === "MACHINE"
                            ? options.machineOptions
                            : options.moldOptions
                  ).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                      {opt.hint ? ` — ${opt.hint}` : ""}
                    </option>
                  ))}
                </Select>
              ) : (
                <div className="relative">
                  <Input
                    id={`hf-${field.key}`}
                    type={field.source === "DATE" ? "date" : field.source === "NUMBER" ? "number" : "text"}
                    value={raw}
                    onChange={(e) => setField(field, e.target.value)}
                    placeholder={field.placeholder ?? ""}
                    disabled={readOnly}
                    aria-required={field.required}
                    className={cn(
                      field.suffix ? "pr-16" : undefined,
                      empty && field.required && "border-warning-400 bg-warning-50/40",
                    )}
                  />
                  {field.suffix ? (
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] font-medium text-ink-400">
                      {field.suffix}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {requiredMissing > 0 ? (
        <div className="flex items-center gap-2 border-t border-warning-500/20 bg-warning-50 px-4 py-2">
          <Info className="h-3 w-3 shrink-0 text-warning-700" aria-hidden="true" />
          <p className="text-[11px] text-warning-800">{t("requiredHint")}</p>
        </div>
      ) : null}
    </section>
  );
}

/** Ringkasan header dalam mode baca (dokumen sudah ada). */
export function SheetHeaderSummary({
  fields,
  values,
}: {
  fields: HeaderField[];
  values: HeaderValues;
}) {
  return (
    <div className="grid gap-x-6 gap-y-3.5 rounded-xl border border-ink-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
      {fields.map((field) => {
        const raw = values[field.key] ?? "";
        return (
          <div key={field.key} className="min-w-0">
            <p className="text-[10px] font-semibold tracking-wider text-ink-400 uppercase">
              {field.label}
            </p>
            <p className="mt-1 truncate text-[13px] font-semibold text-ink-900">
              {raw ? (
                formatValueForDisplay(field, raw)
              ) : (
                <span className="font-normal text-ink-300 italic">—</span>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}
