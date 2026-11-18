import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AlertTriangle, ArrowRight, ClipboardList } from "lucide-react";
import { requirePermission } from "@/server/authz/guard";
import { listNcrs } from "@/server/ncr/ncr-service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, TableWrap, Td, Th } from "@/components/ui/page-header";
import { InspectionDocumentRow } from "@/components/inspection/inspection-document-row";

const TABS = [
  { key: "", labelKey: "all" },
  { key: "OPEN", labelKey: "open" },
  { key: "CONTAINED", labelKey: "contained" },
  { key: "IN_ACTION", labelKey: "inAction" },
  { key: "VERIFIED", labelKey: "verified" },
  { key: "CLOSED", labelKey: "closed" },
] as const;

function severityTone(severity: string) {
  return severity === "CRITICAL" ? "danger" : severity === "MAJOR" ? "warning" : "neutral";
}

function statusTone(status: string) {
  if (status === "CLOSED") return "success" as const;
  if (status === "CANCELLED") return "neutral" as const;
  if (status === "VERIFIED") return "info" as const;
  if (status === "IN_ACTION") return "brand" as const;
  return "warning" as const;
}

export default async function NcrPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; capa?: string }>;
}) {
  const { status } = await searchParams;
  const t = await getTranslations("ncr");
  const ctx = await requirePermission("ncr.read");

  const valid = TABS.some((tab) => tab.key === (status ?? "")) ? (status ?? "") : "";
  const result = await listNcrs(ctx, {
    page: 1,
    pageSize: 50,
    ...(valid
      ? { status: valid as "OPEN" | "CONTAINED" | "IN_ACTION" | "VERIFIED" | "CLOSED" }
      : {}),
  });

  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: t("open"), value: result.items.filter((r) => r.status === "OPEN").length, tone: "warning" },
          { label: t("inAction"), value: result.items.filter((r) => r.status === "IN_ACTION").length, tone: "brand" },
          { label: t("overdue"), value: result.items.filter((r) => r.overdue).length, tone: "danger" },
          { label: t("total"), value: result.total, tone: "neutral" },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="py-4">
              <p className="text-[10px] font-semibold tracking-wider text-ink-400 uppercase">
                {card.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-ink-900 tabular">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((tab) => {
          const active = valid === tab.key;
          return (
            <Link
              key={tab.key || "all"}
              href={tab.key ? `/ncr?status=${tab.key}` : "/ncr"}
              className={
                "rounded-lg px-3 py-1.5 text-[11px] font-semibold transition " +
                (active
                  ? "bg-brand-600 text-white shadow-sm"
                  : "border border-ink-200 bg-white text-ink-600 hover:bg-ink-50")
              }
            >
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          {result.items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <ClipboardList className="h-6 w-6 text-ink-300" />
              <p className="text-sm font-semibold text-ink-700">{t("empty")}</p>
              <p className="max-w-md text-xs text-ink-500">{t("emptyHint")}</p>
              <Link
                href="/reports?view=ng#ng-register"
                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
              >
                {t("openNgRegister")} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th className="w-44">{t("number")}</Th>
                  <Th>{t("part")}</Th>
                  <Th className="w-36">{t("defect")}</Th>
                  <Th className="w-24" align="center">
                    {t("severity")}
                  </Th>
                  <Th className="w-32">{t("pic")}</Th>
                  <Th className="w-32">{t("target")}</Th>
                  <Th className="w-32">{t("status")}</Th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((ncr) => (
                  <InspectionDocumentRow key={ncr.id} href={`/ncr/${ncr.id}`}>
                    <Td>
                      <span className="font-mono text-[11px] font-bold text-brand-600">
                        {ncr.number}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-ink-400">
                        {ncr.createdAt.slice(0, 10)}
                      </span>
                    </Td>
                    <Td>
                      <span className="block text-xs font-medium text-ink-900">{ncr.partNo}</span>
                      <span className="block text-[11px] text-ink-500">{ncr.partName}</span>
                    </Td>
                    <Td>
                      <span className="text-xs text-ink-700">{ncr.defectType}</span>
                      {ncr.defectLocation ? (
                        <span className="block text-[10px] text-ink-400">{ncr.defectLocation}</span>
                      ) : null}
                    </Td>
                    <Td align="center">
                      <Badge tone={severityTone(ncr.severity)}>{ncr.severity}</Badge>
                    </Td>
                    <Td>
                      <span className="text-[11px] text-ink-600">{ncr.picName ?? "—"}</span>
                    </Td>
                    <Td>
                      <span
                        className={
                          "flex items-center gap-1 text-[11px] whitespace-nowrap " +
                          (ncr.overdue ? "font-semibold text-danger-600" : "text-ink-600")
                        }
                      >
                        {ncr.overdue ? <AlertTriangle className="h-3 w-3" /> : null}
                        {ncr.targetDate ?? "—"}
                      </span>
                    </Td>
                    <Td>
                      <Badge tone={statusTone(ncr.status)} dot>
                        {ncr.status}
                      </Badge>
                    </Td>
                  </InspectionDocumentRow>
                ))}
              </tbody>
            </TableWrap>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
