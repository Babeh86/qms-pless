"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Download, TrendingUp, TrendingDown, BarChart3, PieChart } from "lucide-react";
import type { Checksheet } from "@/lib/mock/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { PageHeader, TableWrap, Td, Th, Tr } from "@/components/ui/page-header";
import { ProgressBar, Segmented } from "@/components/ui/toolbar";

const ROUTE_BY_FORM: Record<string, string> = {
  "CS-01": "/inspection/cs-01",
  "CS-02": "/inspection/cs-02",
  "CS-03": "/inspection/cs-03",
  "CS-04": "/inspection/cs-04",
  "CS-05": "/inspection/cs-05",
  "CS-06": "/inspection/cs-06",
};

interface Row {
  formCode: string;
  formName: string;
  total: number;
  ok: number;
  ng: number;
}

function buildRows(list: Checksheet[]): Row[] {
  const map = new Map<string, Row>();
  for (const cs of list) {
    const r = map.get(cs.formCode) ?? {
      formCode: cs.formCode,
      formName: cs.formName,
      total: 0,
      ok: 0,
      ng: 0,
    };
    r.total += 1;
    if (cs.finalJudgment === "OK") r.ok += 1;
    if (cs.finalJudgment === "NG") r.ng += 1;
    map.set(cs.formCode, r);
  }
  return Array.from(map.values()).sort((a, b) => a.formCode.localeCompare(b.formCode));
}

export function ReportsClient({ checksheets }: { checksheets: Checksheet[] }) {
  const t = useTranslations("reports");
  const tLit = useTranslations("lit");
  const router = useRouter();
  const [period, setPeriod] = useState<"7" | "30" | "all">("30");

  const rows = buildRows(checksheets);
  const totalAll = rows.reduce((s, r) => s + r.total, 0);
  const ngAll = rows.reduce((s, r) => s + r.ng, 0);
  const okAll = rows.reduce((s, r) => s + r.ok, 0);
  const ngRate = totalAll === 0 ? 0 : Math.round((ngAll / totalAll) * 100);

  const ngByForm = [...rows].sort((a, b) => b.ng - a.ng).slice(0, 3);
  const ngCases = checksheets.filter((cs) => cs.finalJudgment === "NG");

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <Segmented
              items={[
                { key: "7", label: tLit("d7") },
                { key: "30", label: tLit("d30") },
                { key: "all", label: tLit("allPeriod") },
              ]}
              value={period}
              onChange={setPeriod}
            />
            <Button variant="outline" size="md" iconLeft={<Download className="h-3.5 w-3.5" />}>
              {tLit("export")}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("total")}
          value={totalAll}
          tone="brand"
          icon={<BarChart3 className="h-5 w-5" />}
          trend={{ value: "+8%", positive: true }}
        />
        <StatCard label={t("ok")} value={okAll} tone="success" icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard label={t("ng")} value={ngAll} tone="danger" icon={<TrendingDown className="h-5 w-5" />} />
        <StatCard
          label={t("ngRate")}
          value={`${ngRate}%`}
          tone="warning"
          icon={<PieChart className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("byForm")}</CardTitle>
            <span className="text-xs text-ink-500">{tLit("formCount")} · {rows.length}</span>
          </CardHeader>
          <CardContent className="p-0">
            <TableWrap>
              <thead>
                <tr>
                  <Th className="w-44">{t("form")}</Th>
                  <Th className="w-20" align="center">
                    {t("total")}
                  </Th>
                  <Th className="w-20" align="center">
                    {t("ok")}
                  </Th>
                  <Th className="w-20" align="center">
                    {t("ng")}
                  </Th>
                  <Th className="w-48">{t("ngRate")}</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const rate = r.total === 0 ? 0 : Math.round((r.ng / r.total) * 100);
                  return (
                    <Tr key={r.formCode}>
                      <Td>
                        <span className="block text-xs font-semibold text-ink-900">
                          {r.formCode}
                        </span>
                        <span className="block truncate text-[11px] text-ink-500">{r.formName}</span>
                      </Td>
                      <Td align="center">
                        <span className="text-xs font-bold text-ink-800 tabular">{r.total}</span>
                      </Td>
                      <Td align="center">
                        <Badge tone="success">{r.ok}</Badge>
                      </Td>
                      <Td align="center">
                        <Badge tone={r.ng > 0 ? "danger" : "neutral"}>{r.ng}</Badge>
                      </Td>
                      <Td>
                        <ProgressBar value={r.ng} max={r.total} tone="danger" />
                        <span className="mt-1 block text-[10px] text-ink-400">{rate}%</span>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </TableWrap>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("ngAnalysis")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ngByForm.map((r, i) => (
              <div key={r.formCode}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-ink-100 text-[10px] font-bold text-ink-500">
                      {i + 1}
                    </span>
                    <span className="text-xs font-medium text-ink-800">{r.formCode}</span>
                  </div>
                  <Badge tone="danger">{r.ng} NG</Badge>
                </div>
                <ProgressBar value={r.ng} max={ngAll || 1} tone="danger" showLabel={false} />
              </div>
            ))}

            <div className="mt-4 rounded-lg bg-ink-50 px-3 py-2.5">
              <p className="text-[11px] text-ink-500">{t("placeholder")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card id="ng-register" className="scroll-mt-20">
        <CardHeader>
          <div>
            <CardTitle>{t("ncrRegister")}</CardTitle>
            <p className="mt-0.5 text-[11px] text-ink-500">{t("ncrRegisterHint")}</p>
          </div>
          <Badge tone="danger">{ngCases.length} NG</Badge>
        </CardHeader>
        <CardContent className="p-0">
          {ngCases.length === 0 ? (
            <p className="px-5 py-8 text-center text-xs text-ink-500">{t("noNcrCases")}</p>
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>{t("caseNo")}</Th>
                  <Th>{t("part")}</Th>
                  <Th>{t("lot")}</Th>
                  <Th>{t("inspectionType")}</Th>
                  <Th>{t("date")}</Th>
                  <Th align="center">{t("ngItems")}</Th>
                  <Th>{t("status")}</Th>
                </tr>
              </thead>
              <tbody>
                {ngCases.map((cs) => {
                  const href = `${ROUTE_BY_FORM[cs.formCode] ?? "/inspection"}/${cs.id}`;
                  return (
                    <Tr
                      key={cs.id}
                      className="cursor-pointer"
                      onClick={(event) => {
                        if ((event.target as HTMLElement).closest("a, button")) return;
                        router.push(href);
                      }}
                      role="link"
                      tabIndex={0}
                      ariaLabel={cs.number}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(href);
                        }
                      }}
                    >
                      <Td>
                        <Link href={href} className="font-mono text-[11px] font-bold text-danger-700 hover:underline">
                          {cs.number}
                        </Link>
                      </Td>
                      <Td>
                        <span className="block text-xs font-semibold text-ink-900">{cs.partNo}</span>
                        <span className="block text-[11px] text-ink-500">{cs.partName}</span>
                      </Td>
                      <Td><span className="font-mono text-[11px]">{cs.lotNo}</span></Td>
                      <Td><span className="text-xs">{cs.formCode} · {cs.formName}</span></Td>
                      <Td><span className="whitespace-nowrap text-xs">{cs.inspectionDate}</span></Td>
                      <Td align="center"><Badge tone="danger">{cs.ngItems}</Badge></Td>
                      <Td><Badge tone="neutral" dot>{cs.status}</Badge></Td>
                    </Tr>
                  );
                })}
              </tbody>
            </TableWrap>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
