import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  ArrowLeft,
  Plus,
  FileText,
  CalendarDays,
  Table2,
  Grid3x3,
  Boxes,
  ExternalLink,
} from "lucide-react";
import { getTemplate } from "@/lib/mock/templates";
import { checksheets } from "@/lib/mock/data";
import { Badge, judgmentTone, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, PageHeader, TableWrap, Td, Th } from "@/components/ui/page-header";
import { InspectionDocumentRow } from "@/components/inspection/inspection-document-row";

const LAYOUT_ICON = {
  FLAT_TABLE: Table2,
  MATRIX_TIME: Grid3x3,
  MATRIX_CAVITY: Boxes,
} as const;

/**
 * Daftar dokumen untuk satu checksheet — mis. /inspection/cs-05
 */
export default async function SheetDocumentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meta = getTemplate(slug);
  if (!meta) notFound();

  const t = await getTranslations("inspection");
  const tHeader = await getTranslations("form");

  const docs = checksheets
    .filter((c) => c.formCode === meta.code)
    .sort((a, b) => b.inspectionDate.localeCompare(a.inspectionDate));

  const Icon = LAYOUT_ICON[meta.template.layout];
  const statusCounts = {
    DRAFT: docs.filter((d) => d.status === "DRAFT").length,
    SUBMITTED: docs.filter((d) => d.status === "SUBMITTED").length,
    CHECKED: docs.filter((d) => d.status === "CHECKED").length,
    APPROVED: docs.filter((d) => d.status === "APPROVED").length,
    REJECTED: docs.filter((d) => d.status === "REJECTED").length,
  };

  return (
    <div className="space-y-4">
      <Link
        href="/inspection"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 transition-colors hover:text-brand-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {tHeader("backToList")}
      </Link>

      <PageHeader
        title={`${meta.code} — ${meta.template.title}`}
        description={`${tHeader("docNo")}: ${meta.template.docNo} · ${tHeader("effective")}: ${meta.template.effectiveDate}`}
        actions={
          <Link href={`/inspection/${slug}/new`}>
            <Button size="md" iconLeft={<Plus className="h-4 w-4" />}>
              {t("newSheet")}
            </Button>
          </Link>
        }
      />

      {/* Ringkasan status */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <Badge tone="brand">{meta.template.layout}</Badge>
        <Badge tone="neutral">
          {docs.length} {t("documents")}
        </Badge>
        {statusCounts.DRAFT > 0 ? <Badge tone="neutral">{t("statusDraft", { count: statusCounts.DRAFT })}</Badge> : null}
        {statusCounts.SUBMITTED > 0 ? (
          <Badge tone="warning">{t("statusSubmitted", { count: statusCounts.SUBMITTED })}</Badge>
        ) : null}
        {statusCounts.CHECKED > 0 ? (
          <Badge tone="info">{t("statusChecked", { count: statusCounts.CHECKED })}</Badge>
        ) : null}
        {statusCounts.APPROVED > 0 ? (
          <Badge tone="success">{t("statusApproved", { count: statusCounts.APPROVED })}</Badge>
        ) : null}
        {statusCounts.REJECTED > 0 ? (
          <Badge tone="danger">{t("statusRejected", { count: statusCounts.REJECTED })}</Badge>
        ) : null}
      </div>

      <Card>
        <CardContent className="p-0">
          {docs.length === 0 ? (
            <EmptyState
              title={t("emptySheet")}
              description={t("sheetsSubtitle")}
              icon={<FileText className="h-5 w-5" />}
              action={
                <Link href={`/inspection/${slug}/new`}>
                  <Button size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />}>
                    {t("createFirst")}
                  </Button>
                </Link>
              }
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th className="w-44">{t("number")}</Th>
                  <Th>{t("part")}</Th>
                  <Th className="w-40">{t("lot")}</Th>
                  <Th className="w-28">{t("date")}</Th>
                  <Th className="w-28">{t("status")}</Th>
                  <Th className="w-20" align="center">
                    {t("judgment")}
                  </Th>
                  <Th className="w-32">{t("inspector")}</Th>
                  <Th className="w-16" align="right" />
                </tr>
              </thead>
              <tbody>
                {docs.map((cs) => (
                  <InspectionDocumentRow key={cs.id} href={`/inspection/${slug}/${cs.id}`}>
                    <Td>
                      <Link href={`/inspection/${slug}/${cs.id}`} className="relative after:absolute after:inset-0 after:content-['']">
                        <span className="relative z-[1] font-mono text-[11px] font-bold text-brand-600 group-hover:underline">
                          {cs.number}
                        </span>
                      </Link>
                    </Td>
                    <Td>
                      <span className="block text-xs font-medium text-ink-900">{cs.partNo}</span>
                      <span className="block text-[11px] text-ink-500">{cs.partName}</span>
                    </Td>
                    <Td>
                      <span className="font-mono text-[11px] text-ink-600">{cs.lotNo}</span>
                    </Td>
                    <Td>
                      <span className="flex items-center gap-1 text-xs whitespace-nowrap text-ink-600">
                        <CalendarDays className="h-3 w-3 text-ink-300" aria-hidden="true" />
                        {cs.inspectionDate}
                      </span>
                    </Td>
                    <Td>
                      <Badge tone={statusTone(cs.status)} dot>
                        {cs.status}
                      </Badge>
                    </Td>
                    <Td align="center">
                      <Badge tone={judgmentTone(cs.finalJudgment)}>
                        {cs.finalJudgment ?? "—"}
                      </Badge>
                    </Td>
                    <Td>
                      <span className="text-[11px] text-ink-600">{cs.inspectorName}</span>
                    </Td>
                    <Td align="right">
                      <Link href={`/inspection/${slug}/${cs.id}`}>
                        <Button variant="ghost" size="icon-sm" aria-label={t("open")}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
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
