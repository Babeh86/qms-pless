"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, Save, Send, AlertTriangle, Info, Ruler, Check, Clock3, FileClock } from "lucide-react";
import type { ChecksheetTemplate } from "@/lib/mock/templates-flat";
import {
  SheetHeaderForm,
  EMPTY_HEADER,
  type HeaderValues,
} from "@/components/sheets/sheet-header-form";
import { IDS_CAVITY_COUNT, IDS_ROWS, type IdsRow } from "@/lib/mock/templates-matrix";
import { Badge, judgmentTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/toolbar";
import { cn } from "@/lib/utils/cn";
import { ChecksheetAttachments } from "@/components/sheets/checksheet-attachments";
import { useSaveDraft } from "@/components/sheets/use-save-draft";

type ValueMap = Record<string, string>;

const key = (rowIdx: number, cavity: number) => `${rowIdx}|${cavity}`;

function judgeCell(value: string, row: IdsRow): "OK" | "NG" | null {
  if (!value) return null;
  if (row.inputType === "TEXT") return "OK";
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  if (row.rangeMin === undefined || row.rangeMax === undefined) return null;
  return num >= row.rangeMin && num <= row.rangeMax ? "OK" : "NG";
}

function rowJudge(values: ValueMap, rowIdx: number, row: IdsRow): "OK" | "NG" | null {
  const results = Array.from({ length: IDS_CAVITY_COUNT }, (_, i) =>
    judgeCell(values[key(rowIdx, i + 1)] ?? "", row),
  );
  if (results.some((r) => r === "NG")) return "NG";
  if (results.every((r) => r === "OK")) return "OK";
  return null;
}

export function IdsForm({ template }: { template: ChecksheetTemplate }) {
  const t = useTranslations("form");
  const [values, setValues] = useState<ValueMap>({});
  const [header, setHeader] = useState<HeaderValues>(EMPTY_HEADER);
  const { state: saveState, message: saveMessage, saveDraft, savedId } = useSaveDraft();

  const cavities = Array.from({ length: IDS_CAVITY_COUNT }, (_, i) => i + 1);
  const rowJudgments: ("OK" | "NG" | null)[] = IDS_ROWS.map((row, idx) => rowJudge(values, idx, row));
  const ngRows = rowJudgments.filter((j) => j === "NG").length;
  const filledRows = rowJudgments.filter((j) => j !== null).length;
  const finalJudgment: "OK" | "NG" | null = filledRows === 0 ? null : ngRows > 0 ? "NG" : "OK";
  const headerMissing = template.header.filter(
    (h) => h.required && (header[h.key] ?? "").trim() === "",
  ).length;
  const canSubmit = filledRows === IDS_ROWS.length && ngRows === 0 && headerMissing === 0;

  async function persistDraft(): Promise<string | null> {
    const saved = await saveDraft({
      formCode: template.code,
      formName: template.title,
      templateRevision: "00",
      partNo: header.partNo ?? "",
      partName: header.partName ?? "",
      ...(header.customer ? { customerSnapshot: header.customer } : {}),
      lotNo: header.lotNo ?? "",
      inspectionDate: header.inspectionDate ?? "",
      headerSnapshot: header,
      itemSnapshot: values,
      totalItems: IDS_ROWS.length * IDS_CAVITY_COUNT,
      ngItems: ngRows,
      finalJudgment,
    });
    return saved ? savedId : null;
  }

  function setValue(k: string, v: string) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  return (
    <div className="space-y-4 pb-24">
      <div>
        <Link
          href={`/inspection/${template.code.toLowerCase()}`}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t("backToList")}
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{template.code}</Badge>
          <Badge tone="violet">{template.layout}</Badge>
          <Badge tone="warning" dot>
            DRAFT
          </Badge>
        </div>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-ink-900">
          {t("idsTitle", { code: template.code })}
        </h1>
        <p className="mt-1 text-xs text-ink-500">
          {t("docNo")}: <span className="font-mono font-medium">{template.docNo}</span>
          <span className="mx-1.5 text-ink-300">·</span>
          {t("effective")}: {template.effectiveDate}
        </p>
      </div>

      <SheetHeaderForm
        fields={template.header}
        values={header}
        onChange={setHeader}
        onReset={() => setHeader(EMPTY_HEADER)}
      />

      <ChecksheetAttachments checksheetId={savedId} onBeforeUpload={persistDraft} />

      <Card className="overflow-hidden border-slate-200/80">
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">{t("techDrawing")}</p><p className="mt-0.5 text-[9px] text-slate-500">{t("drawingReferenceHint")}</p></div><Badge tone="neutral">{t("drawingRev10")}</Badge></div>
            <div className="flex min-h-[210px] items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-[linear-gradient(135deg,#fafdff,#f1f7ff)] p-3">
              <svg viewBox="0 0 760 290" role="img" aria-label="Illustrative technical drawing with dimensions and inspection markers" className="h-[210px] w-full max-w-[740px]">
                <g fill="none" stroke="#55718f" strokeWidth="1.5"><path d="M112 222 L112 103 Q112 81 134 81 L227 81 L259 52 L503 52 L532 80 L624 80 Q649 80 649 104 L649 222 L604 232 L570 215 L191 215 L155 232 Z"/><path d="M153 101 L206 101 L227 81 M259 54 L259 213 M501 54 L501 213 M532 101 L606 101 M192 181 L570 181 M206 101 L206 214 M604 101 L604 214" strokeDasharray="5 4"/><path d="M112 247 H649 M112 242 V253 M649 242 V253 M88 81 V232 M83 81 H94 M83 232 H94" stroke="#9aadc2"/><path d="M227 66 L259 38 M227 66 H246 M259 38 H280 M360 51 V22 M355 22 H365 M496 36 L517 55 M511 48 L523 60" stroke="#8ba4bf"/><path d="M145 128 L202 128 M549 128 L613 128 M284 82 V160 M476 82 V160" stroke="#b2c2d3"/></g>
                <g fill="#55718f" fontSize="10" fontFamily="monospace"><text x="364" y="266" textAnchor="middle">{t("drawingDimA")}</text><text x="63" y="160" transform="rotate(-90 63 160)" textAnchor="middle">{t("drawingDimB")}</text><text x="242" y="39">{t("drawingRadius")}</text><text x="368" y="17">{t("drawingDimC")}</text><text x="520" y="43">{t("drawingRadiusPair")}</text><text x="282" y="177">{t("drawingSection")}</text></g>
                <g fontSize="10" fontWeight="700" textAnchor="middle"><circle cx="174" cy="125" r="12" fill="#2563eb"/><text x="174" y="129" fill="white">1</text><circle cx="377" cy="73" r="12" fill="#0ea5e9"/><text x="377" y="77" fill="white">2</text><circle cx="584" cy="125" r="12" fill="#f59e0b"/><text x="584" y="129" fill="white">3</text><circle cx="380" cy="190" r="12" fill="#10b981"/><text x="380" y="194" fill="white">4</text></g>
                <text x="678" y="279" fill="#9aaabd" fontSize="8" textAnchor="end">{t("drawingIllustrative")}</text>
              </svg>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-lg border border-slate-100 bg-slate-50 p-3"><p className="text-[10px] font-bold tracking-wider text-slate-500">{t("inspectionProcess")}</p><div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">{[{label:t("lotNo"),value:header.lotNo || "—"},{label:t("inspectionDate"),value:header.inspectionDate || "—"},{label:t("startInspection"),value:"08:00"},{label:t("finishInspection"),value:"—"},{label:t("inspector"),value:header.inspector || "QC Inspector"},{label:t("pageNumber"),value:"1 / 1"}].map((entry)=><div key={entry.label}><p className="text-[8px] text-slate-400">{entry.label}</p><p className="mt-0.5 truncate text-[10px] font-semibold text-slate-700">{entry.value}</p></div>)}</div></div>
            <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3"><p className="text-[10px] font-bold text-blue-900">{t("measurementGuide")}</p><p className="mt-1 text-[9px] leading-relaxed text-blue-800/75">{t("measurementGuideText")}</p><div className="mt-2 flex flex-wrap gap-1">{["Digital Caliper", "Height Gauge", "Visual Check"].map((tool)=><span key={tool} className="rounded bg-white px-2 py-1 text-[8px] font-semibold text-blue-700 ring-1 ring-blue-100">{tool}</span>)}</div></div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-ink-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Ruler className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
          <span className="text-[11px] font-bold text-ink-800 tabular">
            {t("rowsFilled", { filled: filledRows, total: IDS_ROWS.length })}
          </span>
          <div className="w-28">
            <ProgressBar
              value={filledRows}
              max={IDS_ROWS.length}
              showLabel={false}
              tone={ngRows > 0 ? "danger" : filledRows === IDS_ROWS.length ? "success" : "brand"}
            />
          </div>
        </div>
        {ngRows > 0 ? <Badge tone="danger">{t("ngRows", { count: ngRows })}</Badge> : null}
        <span className="ml-auto text-[11px] text-ink-500">{t("autoJudge")}</span>
      </div>

      <Card className="overflow-hidden">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-ink-300 bg-ink-50">
                <th className="sticky left-0 z-20 w-10 border-r border-ink-200 bg-ink-50 px-2 py-2 text-[10px] font-semibold text-ink-500 uppercase">
                  {t("no")}
                </th>
                <th className="w-28 px-2 py-2 text-[10px] font-semibold text-ink-500 uppercase">
                  {t("itemCheck")}
                </th>
                <th className="w-24 px-2 py-2 text-[10px] font-semibold text-ink-500 uppercase">
                  {t("standard")}
                </th>
                <th className="w-24 px-2 py-2 text-[10px] font-semibold text-ink-500 uppercase">
                  {t("tolerance")}
                </th>
                <th className="w-24 px-2 py-2 text-[10px] font-semibold text-ink-500 uppercase">
                  {t("range")}
                </th>
                <th className="w-16 px-2 py-2 text-[10px] font-semibold text-ink-500 uppercase">
                  {t("tool")}
                </th>
                <th className="w-16 px-2 py-2 text-[10px] font-semibold text-ink-500 uppercase">
                  {t("area")}
                </th>
                {cavities.map((c) => (
                  <th
                    key={c}
                    className="min-w-[56px] border-l border-ink-200 bg-brand-25 px-1 py-2 text-center text-[10px] font-bold text-brand-700 uppercase"
                  >
                    {t("cavityShort", { n: c })}
                  </th>
                ))}
                <th className="w-20 border-l border-ink-200 px-2 py-2 text-center text-[10px] font-semibold text-ink-500 uppercase">
                  {t("judge")}
                </th>
              </tr>
            </thead>
            <tbody>
              {IDS_ROWS.map((row, rowIdx) => {
                const judgment: "OK" | "NG" | null = rowJudgments[rowIdx] ?? null;
                const isNg = judgment === "NG";

                return (
                  <tr
                    key={`${row.no}-${row.area}`}
                    className={cn(
                      "border-b border-ink-100 transition-colors",
                      isNg ? "bg-danger-50/40" : "hover:bg-ink-50/40",
                    )}
                  >
                    <td className="sticky left-0 z-10 border-r border-ink-200 bg-white px-2 py-1 font-mono text-[10px] font-bold text-ink-500">
                      {row.no}
                    </td>
                    <td className="px-2 py-1 text-[11px] font-medium whitespace-nowrap text-ink-900">
                      {row.itemCheck}
                    </td>
                    <td className="px-2 py-1 text-[11px] whitespace-nowrap text-ink-700">
                      {row.dimension}
                    </td>
                    <td className="px-2 py-1 text-[10px] whitespace-nowrap text-ink-500">
                      {row.tolPlus ? `+${row.tolPlus} / −${row.tolMinus}` : "—"}
                    </td>
                    <td className="px-2 py-1 text-[10px] whitespace-nowrap text-ink-500">
                      {row.range ?? "—"}
                    </td>
                    <td className="px-2 py-1 text-[10px] whitespace-nowrap text-ink-600">
                      {row.tool}
                    </td>
                    <td className="px-2 py-1 font-mono text-[10px] font-semibold whitespace-nowrap text-ink-600">
                      {row.area}
                    </td>
                    {cavities.map((c) => {
                      const k = key(rowIdx, c);
                      const v = values[k] ?? "";
                      const cj = judgeCell(v, row);
                      return (
                        <td key={c} className="border-l border-ink-100 px-0.5 py-0.5">
                          <Input
                            value={v}
                            onChange={(e) => setValue(k, e.target.value)}
                            inputMode={row.inputType === "NUMBER" ? "decimal" : undefined}
                            inputSize="sm"
                            aria-label={`${row.itemCheck} ${row.area} cavity ${c}`}
                            className={cn(
                              "h-7 w-full px-1 text-center text-[11px]",
                              cj === "NG" && "border-danger-400 bg-danger-50 text-danger-700",
                              cj === "OK" && "border-success-500/40 bg-success-50/50",
                            )}
                          />
                        </td>
                      );
                    })}
                    <td className="border-l border-ink-200 px-2 py-1 text-center">
                      <Badge tone={judgmentTone(judgment)}>{judgment ?? "—"}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <Card className="border-slate-200/80"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">{t("approvalWorkflow")}</p><p className="mt-0.5 text-[9px] text-slate-500">{t("controlledReview")}</p></div><Badge tone={judgmentTone(finalJudgment)}>{finalJudgment ? `${t("finalStatus")} ${finalJudgment}` : t("incomplete")}</Badge></div><div className="mt-3 grid grid-cols-3 gap-2">{[{label:t("inspectionCompleted"),owner:header.inspector || t("inspector"),state:filledRows ? `${filledRows}/${IDS_ROWS.length} ${t("rows")}` : t("notStarted"),done:filledRows===IDS_ROWS.length},{label:t("checked"),owner:t("checker"),state:t("awaitingSubmission"),done:false},{label:t("approved"),owner:t("approver"),state:t("awaitingCheck"),done:false}].map((step)=><div key={step.label} className={`rounded-lg border p-2.5 ${step.done ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-slate-50"}`}><div className="flex items-center gap-1.5"><span className={`grid h-5 w-5 place-items-center rounded-full ${step.done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>{step.done ? <Check className="h-3 w-3"/> : <Clock3 className="h-3 w-3"/>}</span><span className="text-[9px] font-bold text-slate-700">{step.label}</span></div><p className="mt-2 truncate text-[9px] font-semibold text-slate-600">{step.owner}</p><p className="mt-0.5 text-[8px] text-slate-400">{step.state}</p></div>)}</div></CardContent></Card>
        <Card className="border-slate-200/80"><CardContent className="p-4"><div className="flex items-center gap-2"><FileClock className="h-4 w-4 text-blue-600"/><p className="text-[10px] font-bold tracking-[0.14em] text-slate-500 uppercase">{t("revisionHistory")}</p></div><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[330px] text-left"><thead><tr className="border-b border-slate-100 text-[8px] text-slate-400"><th className="pb-1.5">{t("revShort")}</th><th className="pb-1.5">{t("date")}</th><th className="pb-1.5">{t("content")}</th><th className="pb-1.5">{t("approved")}</th></tr></thead><tbody><tr className="text-[9px] text-slate-600"><td className="py-2 font-bold">{t("initialRevision")}</td><td className="py-2">2026-01-05</td><td className="py-2">{t("initialIssue")}</td><td className="py-2 text-emerald-600">{t("approved")}</td></tr></tbody></table></div><div className="mt-3 border-t border-slate-100 pt-2 text-[8px] text-slate-400">{t("approvalSignatureNote")}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="border-b border-ink-100 px-5 py-3">
            <h2 className="text-[13px] font-semibold text-ink-900">{t("finalJudgment")}</h2>
          </div>
          <CardContent className="flex items-center gap-3">
            <Badge tone={judgmentTone(finalJudgment ?? null)}>{finalJudgment ?? "—"}</Badge>
            <span className="text-[11px] text-ink-500">
              {t("ngRows", { count: ngRows })} ·{" "}
              {t("rowsFilled", { filled: filledRows, total: IDS_ROWS.length })}
            </span>
          </CardContent>
        </Card>

        <Card>
          <div className="border-b border-ink-100 px-5 py-3">
            <h2 className="text-[13px] font-semibold text-ink-900">{t("notes")}</h2>
          </div>
          <CardContent>
            <ul className="space-y-2">
              {template.notes.map((note) => (
                <li key={note} className="flex gap-2 text-[11px] leading-relaxed text-ink-600">
                  {note.startsWith("⚠") ? (
                    <AlertTriangle
                      className="mt-0.5 h-3 w-3 shrink-0 text-warning-500"
                      aria-hidden="true"
                    />
                  ) : (
                    <Info className="mt-0.5 h-3 w-3 shrink-0 text-ink-300" aria-hidden="true" />
                  )}
                  <span>{note.replace("⚠ ", "")}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-ink-500">{t("finalJudgment")}:</span>
            <Badge tone={judgmentTone(finalJudgment)}>{finalJudgment ?? "—"}</Badge>
            <span className="text-[11px] text-ink-500">
              {t("rowsFilled", { filled: filledRows, total: IDS_ROWS.length })}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              iconLeft={<Save className="h-4 w-4" />}
              disabled={saveState === "saving"}
              onClick={() => void persistDraft()}
            >
              {saveState === "saving" ? t("savingDraft") : t("saveDraft")}
            </Button>
            <Button size="md" disabled={!canSubmit} iconLeft={<Send className="h-4 w-4" />}>
              {t("submit")}
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
        {!canSubmit ? (
          <div className="border-t border-warning-500/20 bg-warning-50 px-4 py-1.5 sm:px-6 lg:px-8">
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-warning-800">
              <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
              {ngRows > 0
                ? t("ngRowsBlock", { count: ngRows })
                : t("incompleteHint", { remaining: IDS_ROWS.length - filledRows })}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
