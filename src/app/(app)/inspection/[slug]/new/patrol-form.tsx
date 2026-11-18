"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Save,
  Send,
  AlertTriangle,
  Info,
  User,
  Clock,
  X,
  Camera,
  CheckCircle2,
  Check,
  ShieldCheck,
  Upload,
} from "lucide-react";
import type { ChecksheetTemplate } from "@/lib/mock/templates-flat";
import {
  SheetHeaderForm,
  EMPTY_HEADER,
  type HeaderValues,
} from "@/components/sheets/sheet-header-form";
import {
  PATROL_CHARA,
  PATROL_GROUP_LABEL,
  PATROL_SLOTS,
  type Chara,
} from "@/lib/mock/templates-matrix";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/toolbar";
import { cn } from "@/lib/utils/cn";
import { ChecksheetAttachments } from "@/components/sheets/checksheet-attachments";
import { useSaveDraft } from "@/components/sheets/use-save-draft";

type CellValue = "OK" | "NG" | "NA";

const GROUP_STYLE: Record<Chara["group"], { head: string; cell: string }> = {
  MC_CONDITION: { head: "bg-sky-50", cell: "bg-sky-50/40" },
  APPEARANCE: { head: "bg-white", cell: "bg-white" },
  PACKAGING: { head: "bg-violet-50", cell: "bg-violet-50/40" },
};

const NEXT: Record<string, CellValue | undefined> = {
  undefined: "OK",
  OK: "NG",
  NG: "NA",
  NA: undefined,
};

export function PatrolForm({ template }: { template: ChecksheetTemplate }) {
  const t = useTranslations("form");
  const tLit = useTranslations("lit");
  const [cells, setCells] = useState<Record<string, CellValue>>({});
  const [remark, setRemark] = useState("");
  const [rowRemarks, setRowRemarks] = useState<Record<string, string>>({});
  const [pic, setPic] = useState("QC Inspector 1");
  const [header, setHeader] = useState<HeaderValues>(EMPTY_HEADER);
  const [ngReport, setNgReport] = useState<{ slot: string; no: string } | null>(null);
  const [ngSaved, setNgSaved] = useState(false);
  const { state: saveState, message: saveMessage, saveDraft, savedId, draftKey } =
    useSaveDraft();

  const cellKey = (slot: string, no: string) => `${slot}|${no}`;

  function cycle(slot: string, no: string) {
    const key = cellKey(slot, no);
      setCells((prev) => {
      const next = NEXT[String(prev[key])];
      const updated = { ...prev };
      if (next === undefined) delete updated[key];
      else updated[key] = next;
      return updated;
      });
      if (NEXT[String(cells[cellKey(slot, no)])] === "NG") {
        setNgReport({ slot, no });
      }
  }

  const totalCells = PATROL_SLOTS.length * PATROL_CHARA.length;
  const filled = Object.keys(cells).length;
  const ngCount = Object.values(cells).filter((v) => v === "NG").length;
  const needsRemark = ngCount > 0 && remark.trim().length === 0;
  const headerMissing = template.header.filter(
    (h) => h.required && (header[h.key] ?? "").trim() === "",
  ).length;
  const canSubmit = filled === totalCells && !needsRemark && headerMissing === 0;

  async function persistDraft(): Promise<string | null> {
    const saved = await saveDraft({
      formCode: template.code,
      formName: template.title,
      templateRevision: "00",
      partNo: header.partNo ?? "",
      partName: header.partName ?? "",
      ...(header.customer ? { customerSnapshot: header.customer } : {}),
      lotNo: header.lotNo ?? "",
      inspectionDate: header.date ?? "",
      headerSnapshot: { ...header, pic },
      itemSnapshot: cells,
      remarksSnapshot: rowRemarks,
      totalItems: totalCells,
      ngItems: ngCount,
      finalJudgment: ngCount > 0 ? "NG" : filled === totalCells ? "OK" : null,
    });
    return saved ? savedId : null;
  }

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

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{template.code}</Badge>
          <Badge tone="violet">{template.layout}</Badge>
          <Badge tone="warning" dot>
            DRAFT
          </Badge>
        </div>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-ink-900">
          {t("patrolTitle", { code: template.code })}
        </h1>
        <p className="mt-1 text-xs text-ink-500">
          {t("docNo")}: <span className="font-mono font-medium">{template.docNo}</span>
          <span className="mx-1.5 text-ink-300">·</span>
          {t("effective")}: {template.effectiveDate}
        </p>
      </div>

      {/* ── Header dokumen (diisi user) ── */}
      <SheetHeaderForm
        fields={template.header}
        values={header}
        onChange={setHeader}
        onReset={() => setHeader(EMPTY_HEADER)}
      />

      <ChecksheetAttachments
        checksheetId={savedId}
        draftKey={draftKey}
        onBeforeUpload={persistDraft}
      />

      <Card className="overflow-hidden border-slate-200/80">
        <CardContent className="grid gap-4 p-4 lg:grid-cols-[1.35fr_1fr]">
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">{t("patrolReference")}</p>
            <div className="mt-3 flex min-h-[150px] items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-[linear-gradient(135deg,#f8fbff,#eef6ff)] p-4">
              <svg viewBox="0 0 560 180" role="img" aria-label="Illustration of a molded part with inspection locations" className="h-[148px] w-full max-w-[540px]">
                <defs><linearGradient id="partFill" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#eaf3ff"/><stop offset="1" stopColor="#c9ddf6"/></linearGradient></defs>
                <path d="M75 128 L92 78 Q100 56 127 52 L172 48 L194 29 L372 29 L393 47 L443 54 Q461 58 470 78 L485 128 L452 142 L410 134 L383 148 L175 148 L145 135 L103 143 Z" fill="url(#partFill)" stroke="#5076a5" strokeWidth="3"/>
                <path d="M120 84 L162 77 L177 58 M203 47 L207 132 M378 46 L378 133 M425 76 L455 85 M176 111 L378 111" fill="none" stroke="#7897bb" strokeWidth="2" strokeDasharray="5 4"/>
                <circle cx="148" cy="87" r="13" fill="#2563eb"/><text x="148" y="91" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">A</text>
                <circle cx="291" cy="52" r="13" fill="#0ea5e9"/><text x="291" y="56" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">B</text>
                <circle cx="402" cy="100" r="13" fill="#f59e0b"/><text x="402" y="104" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">C</text>
                <circle cx="271" cy="130" r="13" fill="#10b981"/><text x="271" y="134" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">D</text>
                <text x="280" y="169" textAnchor="middle" fill="#7489a4" fontSize="9" letterSpacing="2">{t("illustrativeReference")}</text>
              </svg>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-3">
            <div><p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">{t("documentRevision")}</p><div className="mt-3 grid grid-cols-3 gap-2">{[{l:t("docNo"),v:template.docNo},{l:t("revision"),v:"00"},{l:t("effectiveDate"),v:template.effectiveDate}].map((x)=><div key={x.l} className="rounded-lg border border-slate-100 bg-slate-50 p-2"><p className="text-[8px] text-slate-400">{x.l}</p><p className="mt-1 truncate text-[10px] font-semibold text-slate-700">{x.v}</p></div>)}</div></div>
            <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3"><div className="flex items-center gap-2"><div className="grid h-7 w-7 place-items-center rounded-md bg-white text-blue-700 shadow-sm"><Info className="h-3.5 w-3.5"/></div><div><p className="text-[10px] font-bold text-blue-900">{t("injectionPatrol")}</p><p className="mt-0.5 text-[9px] text-blue-700/75">{t("referenceLegendHint")}</p></div></div><div className="mt-3 flex flex-wrap gap-1.5">{["A · Visual", "B · Gate", "C · Surface", "D · Fitment"].map((x)=><span key={x} className="rounded bg-white px-2 py-1 text-[8px] font-semibold text-slate-600 ring-1 ring-blue-100">{x}</span>)}</div></div>
          </div>
        </CardContent>
      </Card>

      {/* ── Legenda + progress ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-ink-500">{t("progress")}:</span>
          <span className="text-[11px] font-bold text-ink-800 tabular">
            {t("charsFilled", { filled, total: totalCells })}
          </span>
          <div className="w-28">
            <ProgressBar
              value={filled}
              max={totalCells}
              showLabel={false}
              tone={ngCount > 0 ? "danger" : filled === totalCells ? "success" : "brand"}
            />
          </div>
        </div>

        {ngCount > 0 ? <Badge tone="danger">{t("ngCells", { count: ngCount })}</Badge> : null}

        <div className="ml-auto flex items-center gap-3 text-[11px] text-ink-500">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-success-500" /> OK
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-danger-500" /> NG
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-ink-400" /> {t("na")}
          </span>
        </div>
      </div>

      <p className="flex items-center gap-2 text-[11px] text-ink-500">
        <Info className="h-3 w-3 text-ink-400" aria-hidden="true" />
        {t("clickCycle")}
      </p>

      {/* ── Matrix ── */}
      <Card className="overflow-hidden">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              {/* Baris grup */}
              <tr className="border-b border-ink-200">
                <th
                  rowSpan={2}
                  className="sticky left-0 z-20 w-[110px] min-w-[110px] border-r border-ink-200 bg-ink-50 px-2 py-1.5 text-[10px] font-semibold tracking-wide text-ink-500 uppercase"
                >
                  {t("slot")}
                </th>
                {(["MC_CONDITION", "APPEARANCE", "PACKAGING"] as Chara["group"][]).map((group) => {
                  const count = PATROL_CHARA.filter((c) => c.group === group).length;
                  return (
                    <th
                      key={group}
                      colSpan={count}
                      className={cn(
                        "border-r border-ink-200 px-1 py-1 text-center text-[9px] font-bold tracking-wider whitespace-nowrap text-ink-500 uppercase",
                        GROUP_STYLE[group].head,
                      )}
                    >
                      {PATROL_GROUP_LABEL[group]}
                    </th>
                  );
                })}
                <th
                  rowSpan={2}
                  className="w-[140px] min-w-[140px] border-l border-ink-200 bg-ink-50 px-2 py-1.5 text-[10px] font-semibold tracking-wide text-ink-500 uppercase"
                >
                  {t("remark")}
                </th>
              </tr>
              {/* Baris chara */}
              <tr className="border-b-2 border-ink-300">
                {PATROL_CHARA.map((chara) => (
                  <th
                    key={chara.no}
                    title={chara.text}
                    className={cn(
                      "min-w-[40px] border-r border-ink-100 px-0.5 py-1.5 text-center",
                      GROUP_STYLE[chara.group].head,
                    )}
                  >
                    <span className="block text-[13px] leading-none font-bold text-ink-800">
                      {chara.no}
                    </span>
                    {chara.originalNo ? (
                      <span className="mt-0.5 block text-[8px] leading-none text-warning-600">
                        {chara.originalNo}
                      </span>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PATROL_SLOTS.map((slot, slotIdx) => {
                const rowNg = PATROL_CHARA.some((c) => cells[cellKey(slot, c.no)] === "NG");
                return (
                  <tr
                    key={slot}
                    className={cn(
                      "border-b border-ink-100 transition-colors",
                      rowNg ? "bg-danger-50/40" : slotIdx % 2 === 1 ? "bg-ink-50/30" : "",
                    )}
                  >
                    <td className="sticky left-0 z-10 border-r border-ink-200 bg-white px-2 py-1 font-mono text-[10px] font-semibold whitespace-nowrap text-ink-700">
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5 text-ink-300" aria-hidden="true" />
                        {slot}
                      </span>
                    </td>
                    {PATROL_CHARA.map((chara) => {
                      const v = cells[cellKey(slot, chara.no)];
                      return (
                        <td
                          key={chara.no}
                          className={cn(
                            "border-r border-ink-100 p-0.5 text-center",
                            GROUP_STYLE[chara.group].cell,
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => cycle(slot, chara.no)}
                            title={`${slot} · ${chara.no} — ${chara.text}`}
                            className={cn(
                              "flex h-6 w-full items-center justify-center rounded text-[9px] font-bold transition-all",
                              v === "OK" && "bg-success-500 text-white shadow-sm",
                              v === "NG" && "bg-danger-500 text-white shadow-sm",
                              v === "NA" && "bg-ink-400 text-white",
                              v === undefined && "bg-white/60 text-transparent hover:bg-ink-200",
                            )}
                          >
                            {v ?? "·"}
                          </button>
                        </td>
                      );
                    })}
                    <td className="border-l border-ink-200 px-1 py-0.5">
                      <Input
                        value={rowRemarks[slot] ?? ""}
                        onChange={(e) =>
                          setRowRemarks((prev) => ({ ...prev, [slot]: e.target.value }))
                        }
                        inputSize="sm"
                        className="h-6 border-0 bg-transparent px-1 text-[10px] shadow-none focus:ring-0"
                        placeholder="—"
                        aria-label={`Remark ${slot}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        {[{title:"FIRST SHOT",time:"06:15",status:"OK",owner:pic},{title:"CURRENT CHECK",time:"10:00",status:ngCount ? "NG" : "IN PROGRESS",owner:pic},{title:"LAST SHOT",time:"22:00",status:"PENDING",owner:"—"}].map((shot) => <Card key={shot.title} className="border-slate-200/80"><CardContent className="flex items-center gap-3 p-3"><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${shot.status === "OK" ? "bg-emerald-50 text-emerald-600" : shot.status === "NG" ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-400"}`}>{shot.status === "OK" ? <CheckCircle2 className="h-5 w-5"/> : <Clock className="h-5 w-5"/>}</div><div className="min-w-0 flex-1"><p className="text-[9px] font-bold tracking-wider text-slate-400">{shot.title}</p><p className="mt-0.5 text-sm font-bold text-slate-800">{shot.time} <span className="ml-1 text-[9px] font-semibold text-slate-500">{shot.status}</span></p><p className="truncate text-[10px] text-slate-500">{shot.owner}</p></div><div className="grid h-9 w-9 place-items-center rounded-md border border-dashed border-slate-200 text-slate-300"><Camera className="h-4 w-4"/></div></CardContent></Card>)}
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.2fr_2fr]">
        <Card className="border-slate-200/80"><CardContent className="p-4"><p className="text-[10px] font-bold tracking-widest text-slate-400">{t("documentControl")}</p><div className="mt-3 grid grid-cols-3 gap-3"><div><p className="text-[9px] text-slate-400">{t("docNo")}</p><p className="mt-1 text-[11px] font-semibold text-slate-700">{template.docNo}</p></div><div><p className="text-[9px] text-slate-400">{t("revision")}</p><p className="mt-1 text-[11px] font-semibold text-slate-700">00</p></div><div><p className="text-[9px] text-slate-400">{t("effectiveDate")}</p><p className="mt-1 text-[11px] font-semibold text-slate-700">{template.effectiveDate}</p></div></div></CardContent></Card>
        <Card className="border-slate-200/80"><CardContent className="p-4"><p className="text-[10px] font-bold tracking-widest text-slate-400">{t("approvalWorkflow")}</p><div className="mt-3 grid grid-cols-3 gap-2">{[{label:t("inspector"),name:pic,done:true},{label:t("checked"),name:t("pendingReview"),done:false},{label:t("approved"),name:t("pendingApproval"),done:false}].map((stage)=><div key={stage.label} className={`rounded-lg border p-2.5 ${stage.done ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-slate-50"}`}><div className="flex items-center gap-1.5"><span className={`grid h-5 w-5 place-items-center rounded-full ${stage.done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>{stage.done ? <Check className="h-3 w-3"/> : <Clock className="h-3 w-3"/>}</span><span className="text-[9px] font-bold text-slate-700">{stage.label}</span></div><p className="mt-2 truncate text-[10px] font-medium text-slate-600">{stage.name}</p><p className="mt-0.5 text-[8px] text-slate-400">{stage.done ? t("inProgress") : t("awaiting")}</p></div>)}</div></CardContent></Card>
      </div>

      {/* ── Legenda & remark ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="border-b border-ink-100 px-5 py-3">
            <h2 className="text-[13px] font-semibold text-ink-900">{t("legend")}</h2>
            <p className="mt-0.5 text-[11px] text-ink-500">{tLit("charaCount", { count: PATROL_CHARA.length })}</p>
          </div>
          <CardContent className="max-h-80 space-y-4 overflow-y-auto p-5">
            {(["MC_CONDITION", "APPEARANCE", "PACKAGING"] as Chara["group"][]).map((group) => (
              <div key={group}>
                <p className="mb-1.5 text-[10px] font-bold tracking-wider text-ink-400 uppercase">
                  {PATROL_GROUP_LABEL[group]}
                </p>
                <ul className="space-y-1.5">
                  {PATROL_CHARA.filter((c) => c.group === group).map((c) => (
                    <li key={c.no} className="flex gap-2">
                      <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded bg-ink-100 text-[10px] font-bold text-ink-700">
                        {c.no}
                      </span>
                      <span className="text-[11px] leading-relaxed text-ink-600">{c.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <div className="border-b border-ink-100 px-5 py-3">
            <h2 className="text-[13px] font-semibold text-ink-900">{t("remark")}</h2>
          </div>
          <CardContent className="space-y-3 p-5">
            <div>
              <label htmlFor="patrol-remark" className="mb-1.5 block text-xs font-medium text-ink-700">
                {t("notes")}
              </label>
              <textarea
                id="patrol-remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-ink-300 px-3 py-2 text-xs focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
                placeholder={t("placeholderRemark")}
              />
            </div>

            {needsRemark ? (
              <div className="flex items-start gap-2 rounded-lg border border-danger-500/20 bg-danger-50 px-3 py-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger-600" aria-hidden="true" />
                <p className="text-[11px] font-medium text-danger-700">{t("ngRemarkRequired")}</p>
              </div>
            ) : null}

            <div>
              <label htmlFor="patrol-pic" className="mb-1.5 block text-xs font-medium text-ink-700">
                {t("pic")}
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-ink-400"
                  aria-hidden="true"
                />
                <Input
                  id="patrol-pic"
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-info-500/20 bg-info-50 px-3 py-2">
              <Info className="mt-0.5 h-3 w-3 shrink-0 text-info-600" aria-hidden="true" />
              <p className="text-[11px] text-info-600">{template.notes[0]}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {ngReport ? <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/40 backdrop-blur-[2px]" role="presentation" onClick={() => setNgReport(null)}><section role="dialog" aria-modal="true" aria-labelledby="ng-report-title" className="flex h-full w-full max-w-[480px] flex-col bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between bg-gradient-to-r from-rose-700 to-red-600 px-5 py-4 text-white"><div><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4"/><p className="text-[10px] font-bold tracking-[0.16em]">{t("ncrReport")}</p></div><h2 id="ng-report-title" className="mt-1 text-lg font-bold">{t("recordNg")}</h2></div><button type="button" onClick={() => setNgReport(null)} aria-label={tLit("close")} className="rounded-md p-1.5 text-white/80 hover:bg-white/15 hover:text-white"><X className="h-4 w-4"/></button></div><div className="flex-1 space-y-4 overflow-y-auto p-5"><div className="grid grid-cols-3 gap-2 rounded-lg border border-rose-100 bg-rose-50 p-3"><div><p className="text-[9px] text-rose-500">{t("itemNo")}</p><p className="mt-1 text-xs font-bold text-rose-900">{ngReport.no}</p></div><div><p className="text-[9px] text-rose-500">{t("checkTime")}</p><p className="mt-1 text-xs font-bold text-rose-900">{ngReport.slot}</p></div><div><p className="text-[9px] text-rose-500">{t("inspector")}</p><p className="mt-1 truncate text-xs font-bold text-rose-900">{pic}</p></div><div className="col-span-3 border-t border-rose-200 pt-2"><p className="text-[9px] text-rose-500">{t("inspectionItem")}</p><p className="mt-1 text-xs font-semibold text-rose-900">{PATROL_CHARA.find((chara) => chara.no === ngReport.no)?.text}</p></div></div><label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-slate-700">{t("defectType")} <b className="text-rose-500">*</b></span><select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-blue-400"><option value="">{t("selectDefectType")}</option><option>{t("defectDimension")}</option><option>{t("defectAppearance")}</option><option>{t("defectShortShot")}</option><option>{t("defectDamage")}</option></select></label><div className="grid grid-cols-2 gap-3"><label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-slate-700">{t("defectLocation")}</span><input className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400" placeholder="e.g. Area A"/></label><label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-slate-700">{t("severity")}</span><select className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-400"><option>{t("minor")}</option><option>{t("major")}</option><option>{t("critical")}</option></select></label></div><label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-slate-700">{t("defectDescription")}</span><textarea rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-400" placeholder={t("defectDescription")}/></label><label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 hover:border-blue-300"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-blue-600 shadow-sm"><Upload className="h-4 w-4"/></span><span><strong className="block text-[10px] text-slate-700">{t("photoEvidence")}</strong><small className="text-[9px] text-slate-400">{t("uploadEvidence")}</small></span><input type="file" accept="image/*" className="sr-only"/></label><label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-slate-700">{t("temporaryAction")}</span><textarea rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-400" placeholder={t("temporaryAction")}/></label><div className="grid grid-cols-2 gap-3"><label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-slate-700">{t("picName")}</span><input className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400" placeholder={t("picName")}/></label><label className="block"><span className="mb-1.5 block text-[10px] font-semibold text-slate-700">{t("targetCompletion")}</span><input type="date" className="h-9 w-full rounded-lg border border-slate-200 px-2 text-[10px] outline-none focus:border-blue-400"/></label></div></div><div className="flex justify-end gap-2 border-t border-slate-100 p-4"><Button variant="outline" size="sm" onClick={() => setNgReport(null)}>{tLit("cancel")}</Button><Button variant="danger" size="sm" iconLeft={<ShieldCheck className="h-3.5 w-3.5"/>} onClick={() => { setNgSaved(true); setNgReport(null); }}>{ngSaved ? t("ngSaved") : t("saveNg")}</Button></div></section></div> : null}

      {/* ── Sticky action bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ink-500">
              {t("charsFilled", { filled, total: totalCells })}
            </span>
            <div className="w-24">
              <ProgressBar
                value={filled}
                max={totalCells}
                showLabel={false}
                tone={ngCount > 0 ? "danger" : filled === totalCells ? "success" : "brand"}
              />
            </div>
            {ngCount > 0 ? <Badge tone="danger">{t("ngCells", { count: ngCount })}</Badge> : null}
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
            <Button
              size="md"
              disabled={!canSubmit}
              iconLeft={<Send className="h-4 w-4" />}
            >
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
              {needsRemark
                ? t("ngRemarkRequired")
                : t("incompleteHint", { remaining: totalCells - filled })}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
