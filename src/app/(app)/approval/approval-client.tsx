"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ShieldCheck,
  Clock3,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Inbox,
  CalendarClock,
} from "lucide-react";
import type { Checksheet } from "@/lib/mock/types";
import { Badge, judgmentTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, StatCard } from "@/components/ui/card";
import { EmptyState, PageHeader, TableWrap, Td, Th, Tr } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/toolbar";

const ROUTE_BY_FORM: Record<string, string> = {
  "CS-01": "/inspection/cs-01",
  "CS-02": "/inspection/cs-02",
  "CS-03": "/inspection/cs-03",
  "CS-04": "/inspection/cs-04",
  "CS-05": "/inspection/cs-05",
  "CS-06": "/inspection/cs-06",
};

const TODAY = new Date("2026-01-30").getTime();

function agingDays(dateStr: string): number {
  return Math.max(0, Math.round((TODAY - new Date(dateStr).getTime()) / 86_400_000));
}

type Tab = "CHECKED" | "APPROVED";

export function ApprovalClient({ checksheets }: { checksheets: Checksheet[] }) {
  const t = useTranslations("approval");
  const router = useRouter();
  const tIns = useTranslations("inspection");
  const tLit = useTranslations("lit");
  const [tab, setTab] = useState<Tab>("CHECKED");

  const submitted = checksheets.filter((c) => c.status === "SUBMITTED");
  const checked = checksheets.filter((c) => c.status === "CHECKED");
  const rejected = checksheets.filter((c) => c.status === "REJECTED");

  const rows = tab === "CHECKED" ? submitted : checked;

  const tabs = [
    { key: "CHECKED" as Tab, label: t("pendingChecked"), count: submitted.length },
    { key: "APPROVED" as Tab, label: t("pendingApproved"), count: checked.length },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("pendingChecked")}
          value={submitted.length}
          tone="warning"
          icon={<Clock3 className="h-5 w-5" />}
        />
        <StatCard
          label={t("pendingApproved")}
          value={checked.length}
          tone="brand"
          icon={<ShieldCheck className="h-5 w-5" />}
        />
        <StatCard
          label={t("approvedToday")}
          value={3}
          tone="success"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
        <StatCard
          label={t("rejected")}
          value={rejected.length}
          tone="danger"
          icon={<XCircle className="h-5 w-5" />}
        />
      </div>

      <Tabs items={tabs} value={tab} onChange={setTab} className="w-fit" />

      <Card>
        <CardHeader>
          <CardTitle>{tab === "CHECKED" ? t("pendingChecked") : t("pendingApproved")}</CardTitle>
          <span className="text-xs text-ink-500">{tLit("countDocuments", { count: rows.length })}</span>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <EmptyState
              title={t("empty")}
              description={tLit("emptyHint5")}
              icon={<Inbox className="h-5 w-5" />}
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th className="w-44">{tIns("number")}</Th>
                  <Th className="w-40">{tIns("form")}</Th>
                  <Th>{tIns("part")}</Th>
                  <Th className="w-28">{tIns("date")}</Th>
                  <Th className="w-28">{t("aging")}</Th>
                  <Th className="w-20" align="center">
                    {tIns("judgment")}
                  </Th>
                  <Th className="w-48" align="right">
                    {tLit("action")}
                  </Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((cs) => {
                  const days = agingDays(cs.inspectionDate);
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
                        <span className="font-mono text-[11px] font-bold text-ink-800">
                          {cs.number}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-ink-400">
                          {cs.inspectorName}
                        </span>
                      </Td>
                      <Td>
                        <span className="block text-xs font-semibold text-ink-900">
                          {cs.formCode}
                        </span>
                        <span className="block truncate text-[11px] text-ink-500">
                          {cs.formName}
                        </span>
                      </Td>
                      <Td>
                        <span className="block text-xs font-medium text-ink-900">{cs.partNo}</span>
                        <span className="block text-[11px] text-ink-500">{cs.partName}</span>
                      </Td>
                      <Td>
                        <span className="flex items-center gap-1 text-xs whitespace-nowrap text-ink-600">
                          <CalendarClock className="h-3 w-3 text-ink-300" aria-hidden="true" />
                          {cs.inspectionDate}
                        </span>
                      </Td>
                      <Td>
                        <Badge tone={days > 2 ? "danger" : days > 1 ? "warning" : "neutral"}>
                          {t("days", { days })}
                        </Badge>
                      </Td>
                      <Td align="center">
                        <Badge tone={judgmentTone(cs.finalJudgment)}>
                          {cs.finalJudgment ?? "—"}
                        </Badge>
                      </Td>
                      <Td align="right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={href}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-ink-600 hover:bg-ink-100"
                          >
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            {tLit("view")}
                          </Link>
                          <Button variant="outline" size="xs" className="text-danger-600">
                            {tLit("reject")}
                          </Button>
                          <Button variant="success" size="xs">
                            {tab === "CHECKED" ? "Checked" : "Approve"}
                          </Button>
                        </div>
                      </Td>
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
