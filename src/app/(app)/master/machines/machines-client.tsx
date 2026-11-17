"use client";

import { useTranslations } from "next-intl";
import { Plus, Sun, Moon, Zap, ArrowRightLeft, Gauge } from "lucide-react";
import type { Machine, MachineType } from "@/lib/mock/types";
import { shiftTemplates } from "@/lib/mock/data";
import { Badge, machineTypeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, TableWrap, Td, Th, Tr } from "@/components/ui/page-header";

function shotHint(type: MachineType): { shot: number; label: string } | null {
  if (type === "INJECTION_VERTICAL") return { shot: 6, label: "VERTICAL" };
  if (type === "INJECTION_HORIZONTAL") return { shot: 11, label: "HORIZONTAL" };
  return null;
}

const SHIFT_PRESETS = [
  {
    code: "S3",
    icon: Sun,
    tone: "text-amber-500",
    bg: "bg-amber-50",
    label: "3 Shift",
    detail: "06:00 / 14:00 / 22:00",
    slots: "12 slot patrol",
  },
  {
    code: "S2",
    icon: Moon,
    tone: "text-indigo-500",
    bg: "bg-indigo-50",
    label: "2 Shift",
    detail: "07:00 / 19:00",
    slots: "12 slot patrol",
  },
  {
    code: "S1",
    icon: Zap,
    tone: "text-emerald-500",
    bg: "bg-emerald-50",
    label: "1 Shift",
    detail: "08:00 – 16:00",
    slots: "4 slot patrol",
  },
];

export function MachinesClient({ machines }: { machines: Machine[] }) {
  const t = useTranslations("master.machines");
  const tShift = useTranslations("settings.shift");
  const tLit = useTranslations("lit");

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button size="md" iconLeft={<Plus className="h-4 w-4" />}>
            {t("add")}
          </Button>
        }
      />

      {/* ── Preset shift ── */}
      <div className="grid gap-3 sm:grid-cols-3">
        {SHIFT_PRESETS.map((preset) => {
          const Icon = preset.icon;
          return (
            <div
              key={preset.code}
              className="flex items-start gap-3 rounded-xl border border-ink-200 bg-white p-4 shadow-sm"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${preset.bg} ${preset.tone}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-ink-900">{preset.label}</p>
                  <Badge tone="neutral">{preset.code}</Badge>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-ink-500">{preset.detail}</p>
                <p className="text-[11px] text-ink-400">{preset.slots}</p>
              </div>
            </div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tLit("machineList")}</CardTitle>
          <span className="text-xs text-ink-500">{machines.length} {tLit("unit")}</span>
        </CardHeader>
        <CardContent className="p-0">
          <TableWrap>
            <thead>
              <tr>
                <Th className="w-28">{t("machineNo")}</Th>
                <Th className="w-44">{t("type")}</Th>
                <Th className="w-24">{t("tonnage")}</Th>
                <Th className="w-20">{t("plant")}</Th>
                <Th className="w-36">{t("shift")}</Th>
                <Th>{tLit("shotHint")}</Th>
                <Th className="w-24">{t("status")}</Th>
              </tr>
            </thead>
            <tbody>
              {machines.map((m) => {
                const hint = shotHint(m.type);
                const template = shiftTemplates.find((s) => s.code === m.shiftTemplateCode);

                return (
                  <Tr key={m.id}>
                    <Td>
                      <span className="font-mono text-[11px] font-bold text-ink-900">
                        {m.machineNo}
                      </span>
                    </Td>
                    <Td>
                      <Badge tone={machineTypeTone(m.type)}>
                        {m.type.replace("INJECTION_", "INJ ")}
                      </Badge>
                    </Td>
                    <Td>
                      <span className="flex items-center gap-1 text-xs text-ink-600">
                        <Gauge className="h-3 w-3 text-ink-300" aria-hidden="true" />
                        {m.tonnage ? `${m.tonnage} T` : "—"}
                      </span>
                    </Td>
                    <Td>
                      <span className="text-xs text-ink-600">{m.plantCode}</span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px] font-bold text-ink-700">
                          {m.shiftTemplateCode ?? "—"}
                        </span>
                        {template ? (
                          <span className="text-[11px] text-ink-400">{template.name}</span>
                        ) : null}
                      </div>
                    </Td>
                    <Td>
                      {hint ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-700">
                          <ArrowRightLeft className="h-3 w-3" aria-hidden="true" />
                          {t("shotHint", { shot: hint.shot, label: hint.label })}
                        </span>
                      ) : (
                        <span className="text-xs text-ink-300">—</span>
                      )}
                    </Td>
                    <Td>
                      {m.isActive ? (
                        <Badge tone="success" dot>
                          OK
                        </Badge>
                      ) : (
                        <Badge tone="neutral" dot>
                          —
                        </Badge>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </TableWrap>
        </CardContent>
      </Card>

      <p className="flex items-center gap-2 text-[11px] text-ink-400">
        {tShift("note")}
      </p>
    </div>
  );
}
