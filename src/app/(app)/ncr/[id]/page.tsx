import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { requirePermission } from "@/server/authz/guard";
import { getNcr, listNcrEvents } from "@/server/ncr/ncr-service";
import { ncrAllowedActions } from "@/lib/ncr-workflow";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { NcrWorkflowPanel } from "./ncr-workflow-panel";

export default async function NcrDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requirePermission("ncr.read");
  const t = await getTranslations("ncr");

  let ncr;
  try {
    ncr = await getNcr(ctx, id);
  } catch {
    notFound();
  }

  const events = await listNcrEvents(ctx, id);
  const actions = ctx.permissions.has("ncr.manage") ? ncrAllowedActions(ncr.status) : [];

  return (
    <div className="space-y-4">
      <Link
        href="/ncr"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 transition-colors hover:text-brand-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {t("back")}
      </Link>

      <PageHeader
        title={ncr.number}
        description={`${ncr.partNo} — ${ncr.partName} · ${ncr.lotNo}`}
        actions={
          <Badge tone={ncr.status === "CLOSED" ? "success" : "warning"} dot>
            {ncr.status}
          </Badge>
        }
      />

      {ncr.overdue ? (
        <p className="flex items-center gap-2 rounded-lg border border-danger-500/30 bg-danger-50 px-3 py-2 text-[11px] font-semibold text-danger-700">
          <AlertTriangle className="h-3.5 w-3.5" /> {t("overdueNotice")}
        </p>
      ) : null}

      <Card className="border-slate-200/80">
        <CardHeader>
          <CardTitle>{t("finding")}</CardTitle>
          <Badge tone={ncr.severity === "CRITICAL" ? "danger" : ncr.severity === "MAJOR" ? "warning" : "neutral"}>
            {ncr.severity}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: t("defect"), value: ncr.defectType },
            { label: t("location"), value: ncr.defectLocation ?? "—" },
            { label: t("pic"), value: ncr.picName ?? "—" },
            { label: t("target"), value: ncr.targetDate ?? "—" },
            { label: t("source"), value: ncr.checksheetItemKey ?? "—" },
          ].map((entry) => (
            <div key={entry.label}>
              <p className="text-[9px] font-semibold tracking-wider text-ink-400 uppercase">
                {entry.label}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-ink-800">{entry.value}</p>
            </div>
          ))}
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-[9px] font-semibold tracking-wider text-ink-400 uppercase">
              {t("description")}
            </p>
            <p className="mt-1 text-[11px] text-ink-700">{ncr.description}</p>
          </div>
          {ncr.checksheetId ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <Link
                href={`/inspection/cs-01/${ncr.checksheetId}`}
                className="text-[11px] font-semibold text-brand-600 hover:underline"
              >
                {t("openSource")}
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <NcrWorkflowPanel
        ncrId={ncr.id}
        status={ncr.status}
        actions={actions}
        events={events}
        labels={{
          capaTitle: t("capaTitle"),
          pic: t("pic"),
          target: t("target"),
          containment: t("containment"),
          rootCause: t("rootCause"),
          corrective: t("corrective"),
          preventive: t("preventive"),
          verification: t("verification"),
          note: t("note"),
          noActions: t("noActions"),
          history: t("history"),
          stale: t("stale"),
          incomplete: t("incomplete"),
          failed: t("failed"),
          CONTAIN: t("actContain"),
          PLAN_ACTION: t("actPlan"),
          VERIFY: t("actVerify"),
          CLOSE: t("actClose"),
          REOPEN: t("actReopen"),
          CANCEL: t("actCancel"),
        }}
      />
    </div>
  );
}
