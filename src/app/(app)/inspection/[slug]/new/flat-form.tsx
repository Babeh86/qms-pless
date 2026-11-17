"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Save,
  Send,
  CheckCircle2,
  AlertCircle,
  Info,
  PenLine,
  Lock,
} from "lucide-react";
import type { ChecksheetTemplate, CheckItem } from "@/lib/mock/templates-flat";
import {
  SheetHeaderForm,
  EMPTY_HEADER,
  type HeaderValues,
} from "@/components/sheets/sheet-header-form";
import { Badge, judgmentTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/toolbar";
import { cn } from "@/lib/utils/cn";
import { useSaveDraft } from "@/components/sheets/use-save-draft";
import { ChecksheetAttachments } from "@/components/sheets/checksheet-attachments";

type ValueMap = Record<string, string>;

function itemKey(sIdx: number, iIdx: number) {
  return `${sIdx}-${iIdx}`;
}

function computeJudgment(value: string, item: CheckItem): "OK" | "NG" | null {
  if (item.inputType === "JUDGEMENT") {
    if (!value) return null;
    return value === "OK" ? "OK" : "NG";
  }
  if (item.inputType === "NUMBER") {
    const num = Number(value);
    if (value === "" || Number.isNaN(num)) return null;
    if (item.rangeMin === undefined || item.rangeMax === undefined) return null;
    return num >= item.rangeMin && num <= item.rangeMax ? "OK" : "NG";
  }
  return value ? "OK" : null;
}

export function FlatSheetForm({ template }: { template: ChecksheetTemplate }) {
  const t = useTranslations("form");
  const [values, setValues] = useState<ValueMap>({});
  const [header, setHeader] = useState<HeaderValues>(EMPTY_HEADER);
  const [submitted, setSubmitted] = useState(false);
  const { state: saveState, message: saveMessage, saveDraft } = useSaveDraft();

  const allItems = useMemo(
    () =>
      template.sections.flatMap((s, sIdx) =>
        s.items.map((item, iIdx) => ({ item, key: itemKey(sIdx, iIdx) })),
      ),
    [template],
  );

  const judgments = allItems.map(({ item, key }) => ({
    key,
    judgment: computeJudgment(values[key] ?? "", item),
  }));

  const ngCount = judgments.filter((j) => j.judgment === "NG").length;
  const filledCount = judgments.filter((j) => j.judgment !== null).length;
  const headerMissing = template.header.filter(
    (h) => h.required && (header[h.key] ?? "").trim() === "",
  ).length;
  const isComplete = filledCount === allItems.length && headerMissing === 0;
  const finalJudgment: "OK" | "NG" | null =
    filledCount === 0 ? null : ngCount > 0 ? "NG" : "OK";

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const readOnly = submitted;

  return (
    <div className="space-y-4 pb-24">
      {/* ── Header ── */}
      <div>
        <Link
          href={`/inspection/${template.code.toLowerCase()}`}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t("backToList")}
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">{template.code}</Badge>
              <Badge tone="neutral">{template.layout}</Badge>
              {readOnly ? (
                <Badge tone="success" dot>
                  SUBMITTED
                </Badge>
              ) : (
                <Badge tone="warning" dot>
                  DRAFT
                </Badge>
              )}
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-ink-900">{template.title}</h1>
            <p className="mt-1 text-xs text-ink-500">
              {t("docNo")}: <span className="font-mono font-medium">{template.docNo}</span>
              <span className="mx-1.5 text-ink-300">·</span>
              {t("effective")}: {template.effectiveDate}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {readOnly ? (
              <Badge tone="success">
                <Lock className="h-3 w-3" aria-hidden="true" />
                {t("readOnly")}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Header dokumen (diisi user) ── */}
      <SheetHeaderForm
        fields={template.header}
        values={header}
        onChange={setHeader}
        readOnly={submitted}
        onReset={() => setHeader(EMPTY_HEADER)}
      />

      <ChecksheetAttachments />

      <div className="flex items-start gap-2 rounded-lg border border-info-500/20 bg-info-50 px-3 py-2.5">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info-600" aria-hidden="true" />
        <p className="text-xs text-info-600">{t("fillHint")}</p>
      </div>

      {/* ── Sections ── */}
      {template.sections.map((section, sIdx) => {
        const sectionItems = section.items.map((item, iIdx) => ({
          item,
          key: itemKey(sIdx, iIdx),
        }));
        const sectionFilled = sectionItems.filter(
          ({ item, key }) => computeJudgment(values[key] ?? "", item) !== null,
        ).length;

        return (
          <Card key={section.title}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-5 py-3">
              <div className="flex items-center gap-2">
                <h2 className="text-[13px] font-semibold text-ink-900">{section.title}</h2>
                <Badge tone={sectionFilled === sectionItems.length ? "success" : "neutral"}>
                  {sectionFilled}/{sectionItems.length}
                </Badge>
              </div>
              <div className="w-28">
                <ProgressBar
                  value={sectionFilled}
                  max={sectionItems.length}
                  showLabel={false}
                  tone={sectionFilled === sectionItems.length ? "success" : "brand"}
                />
              </div>
            </div>

            <CardContent className="p-0">
              <div className="scrollbar-thin overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-ink-200 bg-ink-50/80">
                      <th className="px-4 py-2.5 text-[11px] font-semibold tracking-wide text-ink-500 uppercase">
                        {t("itemCheck")}
                      </th>
                      <th className="w-[300px] px-4 py-2.5 text-[11px] font-semibold tracking-wide text-ink-500 uppercase">
                        {t("standard")}
                      </th>
                      <th className="w-[240px] px-4 py-2.5 text-[11px] font-semibold tracking-wide text-ink-500 uppercase">
                        {t("actual")}
                      </th>
                      <th className="w-[88px] px-4 py-2.5 text-center text-[11px] font-semibold tracking-wide text-ink-500 uppercase">
                        {t("judgment")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionItems.map(({ item, key }) => {
                      const value = values[key] ?? "";
                      const judgment = computeJudgment(value, item);
                      const isNg = judgment === "NG";

                      return (
                        <tr
                          key={key}
                          className={cn(
                            "border-b border-ink-100 transition-colors last:border-0",
                            isNg ? "bg-danger-50/50" : "hover:bg-ink-50/50",
                          )}
                        >
                          <td className="px-4 py-3 align-top">
                            <div className="flex gap-2.5">
                              {item.no ? (
                                <span className="mt-0.5 shrink-0 rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-ink-500">
                                  {item.no}
                                </span>
                              ) : null}
                              <div className="min-w-0">
                                <p className="font-medium text-ink-900">{item.detailCheck}</p>
                                {item.tool ? (
                                  <p className="mt-1 inline-flex items-center gap-1 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">
                                    {t("tool")}: {item.tool}
                                  </p>
                                ) : null}
                                {item.subChecks ? (
                                  <ul className="mt-1.5 space-y-0.5">
                                    {item.subChecks.map((sub) => (
                                      <li key={sub} className="text-[11px] text-ink-500">
                                        {sub}
                                      </li>
                                    ))}
                                  </ul>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 align-top">
                            <p className="text-[13px] whitespace-pre-line text-ink-700">
                              {item.standardText ?? "—"}
                            </p>
                            {item.rangeMin !== undefined && item.rangeMax !== undefined ? (
                              <p className="mt-1 inline-flex items-center gap-1 rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
                                {t("range")}: {item.rangeMin} – {item.rangeMax}
                              </p>
                            ) : null}
                          </td>

                          <td className="px-4 py-3 align-top">
                            {item.inputType === "JUDGEMENT" ? (
                              <div className="flex gap-1.5">
                                {(["OK", "NG"] as const).map((opt) => {
                                  const selected = value === opt;
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      disabled={readOnly}
                                      onClick={() => setValue(key, opt)}
                                      aria-pressed={selected}
                                      className={cn(
                                        "h-8 flex-1 rounded-md border text-xs font-bold transition-all",
                                        selected && opt === "OK" && "border-success-500 bg-success-500 text-white shadow-sm",
                                        selected && opt === "NG" && "border-danger-500 bg-danger-500 text-white shadow-sm",
                                        !selected &&
                                          "border-ink-300 bg-white text-ink-500 hover:border-ink-400 hover:bg-ink-50",
                                        readOnly && "cursor-not-allowed opacity-60",
                                      )}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div>
                                <Input
                                  value={value}
                                  onChange={(e) => setValue(key, e.target.value)}
                                  placeholder={item.exampleValue ?? ""}
                                  inputMode={item.inputType === "NUMBER" ? "decimal" : undefined}
                                  aria-label={item.detailCheck}
                                  disabled={readOnly}
                                  className={cn("h-8 text-[13px]", isNg && "border-danger-400 bg-danger-50")}
                                  invalid={isNg}
                                />
                                {item.standardSource === "MANUAL_INPUT" ? (
                                  <p className="mt-1 text-[10px] font-medium text-warning-600">
                                    {t("manualStandard")}
                                  </p>
                                ) : null}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3 text-center align-top">
                            <Badge tone={judgmentTone(judgment)}>
                              {judgment ?? "—"}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* ── Tanda tangan + catatan ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="border-b border-ink-100 px-5 py-3">
            <h2 className="text-[13px] font-semibold text-ink-900">{t("signatures")}</h2>
          </div>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            {[
              { label: t("inspector"), name: "QC Inspector 1", filled: true },
              { label: t("checked"), name: "—", filled: false },
              { label: t("approved"), name: "—", filled: false },
            ].map((sig) => (
              <div
                key={sig.label}
                className={cn(
                  "rounded-lg border px-3 py-4 text-center",
                  sig.filled
                    ? "border-success-500/30 bg-success-50"
                    : "border-dashed border-ink-300 bg-ink-50/50",
                )}
              >
                <p className="text-[10px] font-semibold tracking-wider text-ink-400 uppercase">
                  {sig.label}
                </p>
                {sig.filled ? (
                  <CheckCircle2 className="mx-auto mt-2 h-4 w-4 text-success-600" aria-hidden="true" />
                ) : (
                  <PenLine className="mx-auto mt-2 h-4 w-4 text-ink-300" aria-hidden="true" />
                )}
                <p className="mt-1 text-[11px] font-medium text-ink-700">{sig.name}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <div className="border-b border-ink-100 px-5 py-3">
            <h2 className="text-[13px] font-semibold text-ink-900">{t("notes")}</h2>
          </div>
          <CardContent>
            <ul className="space-y-1.5 text-[11px] text-ink-600">
              {template.notes.map((note) => (
                <li key={note} className="flex gap-1.5">
                  <span className="text-ink-300">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 border-t border-ink-100 pt-2.5">
              <p className="text-[10px] font-semibold tracking-wider text-ink-400 uppercase">
                {t("revHistory")}
              </p>
              <ul className="mt-1 space-y-1">
                {template.revisionHistory.map((rev) => (
                  <li key={`${rev.rev}-${rev.date}`} className="text-[11px] text-ink-500">
                    {t("revLine", {
                      rev: rev.rev,
                      date: rev.date,
                      content: rev.content,
                      pic: rev.pic,
                    })}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Sticky action bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-ink-500">{t("finalJudgment")}:</span>
            <Badge tone={judgmentTone(finalJudgment)}>{finalJudgment ?? "—"}</Badge>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ink-500">
              {t("itemsFilled", { filled: filledCount, total: allItems.length })}
            </span>
            <div className="w-24">
              <ProgressBar
                value={filledCount}
                max={allItems.length}
                showLabel={false}
                tone={ngCount > 0 ? "danger" : isComplete ? "success" : "brand"}
              />
            </div>
            {ngCount > 0 ? <Badge tone="danger">{t("ngCells", { count: ngCount })}</Badge> : null}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              iconLeft={<Save className="h-4 w-4" />}
              disabled={readOnly || saveState === "saving"}
              onClick={() =>
                void saveDraft({
                  formCode: template.code,
                  formName: template.title,
                  templateRevision: "00",
                  partNo: header.partNo ?? "",
                  partName: header.partName ?? "",
                  ...(header.supplier ? { supplierSnapshot: header.supplier } : {}),
                  ...(header.customer ? { customerSnapshot: header.customer } : {}),
                  lotNo: header.lotNo ?? "",
                  inspectionDate: header.inspectionDate ?? "",
                  headerSnapshot: header,
                  itemSnapshot: values,
                  totalItems: allItems.length,
                  ngItems: ngCount,
                  finalJudgment,
                })
              }
            >
              {saveState === "saving" ? t("savingDraft") : t("saveDraft")}
            </Button>
            <Button
              size="md"
              iconLeft={submitted ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
              disabled={!isComplete || submitted}
              onClick={() => setSubmitted(true)}
            >
              {submitted ? t("submitted") : t("submit")}
            </Button>
          </div>
          {saveMessage ? (
            <p
              role="status"
              className={
                "text-[11px] font-medium " +
                (saveState === "error" ? "text-danger-600" : "text-success-600")
              }
            >
              {saveMessage}
            </p>
          ) : null}
        </div>

        {!isComplete && !submitted ? (
          <div className="border-t border-warning-500/20 bg-warning-50 px-4 py-1.5 sm:px-6 lg:px-8">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-warning-800">
              <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
              {t("incompleteHint", { remaining: allItems.length - filledCount })}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
