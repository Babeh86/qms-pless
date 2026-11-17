"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Hash,
  CalendarClock,
  Archive,
  CheckCircle2,
  Plus,
  Pencil,
  Sun,
  Moon,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader, TableWrap, Td, Th, Tr } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/toolbar";
import { numberingRules, shiftTemplates, shifts, workSchedules } from "@/lib/mock/data";
import { generateSlots } from "@/lib/mock/templates-matrix";
import { cn } from "@/lib/utils/cn";

type Tab = "numbering" | "shift" | "retention";

const PLANT = "KRW";

function renderPreview(pattern: string, seq: number, padding: number): string {
  const d = new Date("2026-01-30T00:00:00");
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");

  return pattern
    .replaceAll("{PREFIX}", "CS")
    .replaceAll("{YYYY}", String(d.getFullYear()))
    .replaceAll("{YY}", String(d.getFullYear()).slice(-2))
    .replaceAll("{MM}", pad(d.getMonth() + 1))
    .replaceAll("{DD}", pad(d.getDate()))
    .replaceAll("{PLANT}", PLANT)
    .replaceAll("{FORM_CODE}", "CS01")
    .replaceAll("{DOC_TYPE}", "CHECK_SHEET")
    .replaceAll("{SUPPLIER_CODE}", "PASI")
    .replaceAll("{PART_NO}", "7145-0040-0w")
    .replace(/\{SEQ(?::(\d+))?\}/g, (_, w?: string) =>
      String(seq).padStart(Number(w ?? padding), "0"),
    );
}

const RESET_TONE: Record<string, "brand" | "warning" | "success" | "neutral"> = {
  MONTHLY: "brand",
  DAILY: "warning",
  YEARLY: "success",
  NEVER: "neutral",
  PER_SHIFT: "warning",
};

function NumberingTab() {
  const t = useTranslations("settings.numbering");

  return (
    <div className="space-y-3">
      <p className="flex items-start gap-2 rounded-lg border border-info-500/20 bg-info-50 px-3 py-2.5 text-xs text-info-600">
        <Hash className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {t("note")}
      </p>

      <div className="grid gap-3 lg:grid-cols-2">
        {numberingRules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle className="font-mono">{rule.docType}</CardTitle>
                <Badge tone={RESET_TONE[rule.resetPeriod] ?? "neutral"}>{rule.resetPeriod}</Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge tone="neutral">{rule.scope}</Badge>
                <Button variant="ghost" size="icon-sm" aria-label="Ubah">
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <p className="text-[10px] font-medium tracking-wide text-ink-400 uppercase">
                    {t("format")}
                  </p>
                  <Input
                    readOnly
                    value={rule.formatPattern}
                    className="mt-1 h-8 font-mono text-[11px]"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-medium tracking-wide text-ink-400 uppercase">
                    {t("nextValue")}
                  </p>
                  <Input
                    readOnly
                    value={String(rule.nextValue).padStart(rule.padding, "0")}
                    className="mt-1 h-8 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-[10px] font-medium tracking-wide text-ink-400 uppercase">
                  {t("preview")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[0, 1, 2].map((offset) => (
                    <code
                      key={offset}
                      className="rounded bg-brand-50 px-2 py-1 font-mono text-[10px] font-semibold text-brand-700"
                    >
                      {renderPreview(rule.formatPattern, rule.nextValue + offset, rule.padding)}
                    </code>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ShiftTab() {
  const t = useTranslations("settings.shift");
  const tLit = useTranslations("lit");
  const [code, setCode] = useState("S3");

  const active = shiftTemplates.find((s) => s.code === code);
  const list = shifts.filter((s) => s.templateCode === code);
  const slots = active ? generateSlots(list, active.slotDurationMinutes) : [];

  const ICONS = { S3: Sun, S2: Moon, S1: Zap, NS: Sun } as const;

  return (
    <div className="space-y-3">
      <p className="flex items-start gap-2 rounded-lg border border-info-500/20 bg-info-50 px-3 py-2.5 text-xs text-info-600">
        <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {t("note")}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {shiftTemplates.map((tpl) => {
          const Icon = ICONS[tpl.code as keyof typeof ICONS] ?? Sun;
          const selected = code === tpl.code;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => setCode(tpl.code)}
              aria-pressed={selected}
              className={cn(
                "rounded-xl border p-3.5 text-left transition-all",
                selected
                  ? "border-brand-500 bg-brand-25 ring-2 ring-brand-500/20"
                  : "border-ink-200 bg-white hover:border-ink-300 hover:shadow-sm",
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    selected ? "bg-brand-100 text-brand-600" : "bg-ink-100 text-ink-500",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <Badge tone={selected ? "brand" : "neutral"}>{tpl.code}</Badge>
              </div>
              <p className="mt-2 text-xs font-semibold text-ink-900">{tpl.name}</p>
              <p className="text-[11px] text-ink-500">
                {t("shiftCount", { count: tpl.shiftCount })}
              </p>
              <p className="text-[11px] text-ink-400">
                {t("slotInfo", { slot: tpl.slotDurationMinutes, hours: tpl.totalHoursPerDay })}
              </p>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("shifts")}</CardTitle>
          <Badge tone="brand">{code}</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <TableWrap>
            <thead>
              <tr>
                <Th className="w-32">{t("name")}</Th>
                <Th className="w-24">{t("start")}</Th>
                <Th className="w-24">{t("end")}</Th>
                <Th className="w-32">{t("duration")}</Th>
                <Th className="w-32">{t("midnight")}</Th>
                <Th className="w-28">{t("night")}</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <Tr key={s.id}>
                  <Td>
                    <span className="text-xs font-medium text-ink-900">{s.name}</span>
                  </Td>
                  <Td>
                    <code className="font-mono text-[11px] text-ink-700">{s.startTime}</code>
                  </Td>
                  <Td>
                    <code className="font-mono text-[11px] text-ink-700">{s.endTime}</code>
                  </Td>
                  <Td>
                    <span className="text-xs text-ink-600">
                      {t("minutes", { value: s.durationMinutes })}
                    </span>
                  </Td>
                  <Td>
                    {s.crossesMidnight ? (
                      <Badge tone="warning">{t("yes")}</Badge>
                    ) : (
                      <span className="text-xs text-ink-300">—</span>
                    )}
                  </Td>
                  <Td>
                    {s.isNightShift ? (
                      <Badge tone="violet">{t("yes")}</Badge>
                    ) : (
                      <span className="text-xs text-ink-300">—</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("generatedSlots")}</CardTitle>
          <Badge tone="success">{t("slotsCount", { count: slots.length })}</Badge>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {slots.map((slot, i) => (
              <div key={slot} className="flex items-center gap-1.5">
                <code className="rounded-md border border-ink-200 bg-ink-50 px-2 py-1 font-mono text-[11px] font-medium text-ink-700">
                  {slot}
                </code>
                {i < slots.length - 1 ? (
                  <ArrowRight className="h-3 w-3 text-ink-300" aria-hidden="true" />
                ) : null}
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-ink-50 px-3 py-2 text-[11px] text-ink-500">
            {t("generatedNote")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("schedules")}</CardTitle>
          <Button variant="outline" size="xs" iconLeft={<Plus className="h-3 w-3" />}>
            {tLit("add")}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <TableWrap>
            <thead>
              <tr>
                <Th className="w-44">{t("code")}</Th>
                <Th>{t("name")}</Th>
                <Th className="w-52">{t("period")}</Th>
                <Th className="w-64">{t("workDays")}</Th>
                <Th className="w-40">{t("holidays")}</Th>
              </tr>
            </thead>
            <tbody>
              {workSchedules.map((ws) => (
                <Tr key={ws.id}>
                  <Td>
                    <span className="font-mono text-[11px] font-bold text-ink-800">{ws.code}</span>
                  </Td>
                  <Td>
                    <span className="text-xs text-ink-700">{ws.name}</span>
                  </Td>
                  <Td>
                    <span className="text-[11px] whitespace-nowrap text-ink-600">
                      {ws.effectiveFrom} → {ws.effectiveTo}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {ws.workDays.map((d) => (
                        <Badge key={d} tone="brand">
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </Td>
                  <Td>
                    <span className="text-[11px] text-ink-600">
                      {ws.holidays.length > 0 ? ws.holidays.join(", ") : "—"}
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        </CardContent>
      </Card>
    </div>
  );
}

function RetentionTab() {
  const t = useTranslations("settings.retention");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <Badge tone="brand">
          <Archive className="h-3 w-3" aria-hidden="true" />
          ARCHIVED
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-xs">
          <label
            htmlFor="retention-years"
            className="text-[10px] font-medium tracking-wide text-ink-400 uppercase"
          >
            {t("years")}
          </label>
          <Input id="retention-years" readOnly value="10" className="mt-1" />
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-success-500/20 bg-success-50 px-3 py-2.5">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-600" aria-hidden="true" />
          <p className="text-xs text-success-700">{t("note")}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsClient() {
  const t = useTranslations("settings");
  const [tab, setTab] = useState<Tab>("numbering");

  const tabs = [
    { key: "numbering" as Tab, label: t("tabNumbering") },
    { key: "shift" as Tab, label: t("tabShift") },
    { key: "retention" as Tab, label: t("tabRetention") },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} description={t("subtitle")} />
      <Tabs items={tabs} value={tab} onChange={setTab} className="w-fit" />

      {tab === "numbering" ? <NumberingTab /> : null}
      {tab === "shift" ? <ShiftTab /> : null}
      {tab === "retention" ? <RetentionTab /> : null}
    </div>
  );
}
