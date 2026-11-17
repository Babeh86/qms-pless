"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ClipboardCheck,
  ArrowRight,
  Plus,
  Table2,
  Grid3x3,
  Boxes,
  FileText,
  CalendarDays,
  ExternalLink,
} from "lucide-react";
import type { Checksheet, ChecksheetStatus } from "@/lib/mock/types";
import { TEMPLATE_REGISTRY } from "@/lib/mock/templates";
import { Badge, judgmentTone, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, PageHeader, TableWrap, Td, Th, Tr } from "@/components/ui/page-header";
import { SearchInput, Tabs, Toolbar } from "@/components/ui/toolbar";

type StatusTab = "ALL" | ChecksheetStatus;

const LAYOUT_ICON = {
  FLAT_TABLE: Table2,
  MATRIX_TIME: Grid3x3,
  MATRIX_CAVITY: Boxes,
} as const;

const LAYOUT_TONE = {
  FLAT_TABLE: "brand",
  MATRIX_TIME: "violet",
  MATRIX_CAVITY: "warning",
} as const;

export function InspectionClient({ checksheets }: { checksheets: Checksheet[] }) {
  const t = useTranslations("inspection");
  const router = useRouter();
  const [status, setStatus] = useState<StatusTab>("ALL");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const base: Record<string, number> = { ALL: checksheets.length };
    for (const s of ["DRAFT", "SUBMITTED", "CHECKED", "APPROVED", "REJECTED"] as const) {
      base[s] = checksheets.filter((c) => c.status === s).length;
    }
    return base;
  }, [checksheets]);

  const tabs: { key: StatusTab; label: string; count: number }[] = [
    { key: "ALL", label: t("tabAll"), count: counts.ALL ?? 0 },
    { key: "DRAFT", label: t("tabDraft"), count: counts.DRAFT ?? 0 },
    { key: "SUBMITTED", label: t("tabSubmitted"), count: counts.SUBMITTED ?? 0 },
    { key: "CHECKED", label: t("tabChecked"), count: counts.CHECKED ?? 0 },
    { key: "APPROVED", label: t("tabApproved"), count: counts.APPROVED ?? 0 },
    { key: "REJECTED", label: t("tabRejected"), count: counts.REJECTED ?? 0 },
  ];

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return checksheets
      .filter((c) => status === "ALL" || c.status === status)
      .filter(
        (c) =>
          !q ||
          c.number.toLowerCase().includes(q) ||
          c.partNo.toLowerCase().includes(q) ||
          c.partName.toLowerCase().includes(q) ||
          c.lotNo.toLowerCase().includes(q),
      )
      .sort((a, b) => b.inspectionDate.localeCompare(a.inspectionDate));
  }, [checksheets, status, query]);

  return (
    <div className="space-y-5">
      <PageHeader title={t("title")} description={t("subtitle")} />

      {/* ══════════ Tab per status ══════════ */}
      <Tabs items={tabs} value={status} onChange={setStatus} />

      {/* ══════════ 6 Checksheet terpisah ══════════ */}
      <section aria-labelledby="sheet-grid-title">
        <div className="mb-2.5 flex items-end justify-between">
          <div>
            <h2 id="sheet-grid-title" className="text-sm font-semibold text-ink-900">
              {t("sheetsTitle")}
            </h2>
            <p className="text-xs text-ink-500">{t("sheetsSubtitle")}</p>
          </div>
          <span className="text-[11px] text-ink-400">
            {TEMPLATE_REGISTRY.length} {t("documents")}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {TEMPLATE_REGISTRY.map((meta) => {
            const Icon = LAYOUT_ICON[meta.template.layout];
            const tone = LAYOUT_TONE[meta.template.layout];

            const sheetDocs = filteredDocs.filter((c) => c.formCode === meta.code);
            const totalAll = checksheets.filter((c) => c.formCode === meta.code).length;
            const pending = checksheets.filter(
              (c) =>
                c.formCode === meta.code &&
                (c.status === "SUBMITTED" || c.status === "CHECKED" || c.status === "DRAFT"),
            ).length;

            return (
              <Card
                key={meta.slug}
                className="group relative overflow-hidden transition-all hover:border-brand-300 hover:shadow-md"
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-500 transition-colors group-hover:bg-brand-100 group-hover:text-brand-600">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-mono text-[11px] font-bold text-ink-500">{meta.code}</p>
                        <p className="truncate text-[13px] font-semibold text-ink-900">
                          {meta.template.title}
                        </p>
                      </div>
                    </div>
                    <Badge tone={tone}>{meta.template.layout.replace("MATRIX_", "")}</Badge>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge tone="neutral">
                      {sheetDocs.length}/{totalAll} {t("documents")}
                    </Badge>
                    {pending > 0 ? (
                      <Badge tone="warning" dot>
                        {t("pending", { count: pending })}
                      </Badge>
                    ) : null}
                  </div>

                  {sheetDocs.length === 0 ? (
                    <p className="rounded-md bg-ink-50 px-2.5 py-2 text-[11px] text-ink-400">
                      {t("emptySheet")}
                    </p>
                  ) : (
                    <ul className="-mx-1 space-y-0.5">
                      {sheetDocs.slice(0, 3).map((doc) => (
                        <li key={doc.id}>
                          <Link
                            href={`/inspection/${meta.slug}/${doc.id}`}
                            className="flex items-center justify-between gap-2 rounded-md px-1 py-1 transition-colors hover:bg-ink-50"
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-mono text-[10px] font-semibold text-brand-600">
                                {doc.number}
                              </span>
                              <span className="flex items-center gap-1 text-[10px] text-ink-400">
                                <CalendarDays className="h-2.5 w-2.5" aria-hidden="true" />
                                {doc.inspectionDate}
                              </span>
                            </span>
                            <Badge tone={statusTone(doc.status)}>{doc.status}</Badge>
                          </Link>
                        </li>
                      ))}
                      {sheetDocs.length > 3 ? (
                        <li className="px-1 pt-0.5 text-[10px] text-ink-400">
                          {t("more", { count: sheetDocs.length - 3 })}
                        </li>
                      ) : null}
                    </ul>
                  )}

                  <div className="flex gap-1.5 border-t border-ink-100 pt-2.5">
                    <Link href={`/inspection/${meta.slug}/new`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <FileText className="h-3 w-3" aria-hidden="true" />
                        {t("open")}
                      </Button>
                    </Link>
                    <Link href={`/inspection/${meta.slug}/new`}>
                      <Button variant="primary" size="sm" aria-label={t("newSheet")}>
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ══════════ Daftar dokumen (difilter status) ══════════ */}
      <section aria-labelledby="doc-list-title" className="space-y-2.5">
        <div className="flex items-end justify-between">
          <h2 id="doc-list-title" className="text-sm font-semibold text-ink-900">
            {status === "ALL" ? t("tabAll") : t(`tab${status.charAt(0)}${status.slice(1).toLowerCase()}`)}
          </h2>
          <span className="text-[11px] text-ink-400">{t("countDocs", { count: filteredDocs.length })}</span>
        </div>

        <Toolbar>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={t("search")}
            className="w-full sm:w-80"
          />
        </Toolbar>

        <Card>
          <CardContent className="p-0">
            {filteredDocs.length === 0 ? (
              <EmptyState
                title={t("empty")}
                description="Belum ada dokumen dengan status ini."
                icon={<ClipboardCheck className="h-5 w-5" />}
              />
            ) : (
              <TableWrap>
                <thead>
                  <tr>
                    <Th className="w-44">{t("number")}</Th>
                    <Th className="w-40">{t("form")}</Th>
                    <Th>{t("part")}</Th>
                    <Th className="w-40">{t("lot")}</Th>
                    <Th className="w-28">{t("date")}</Th>
                    <Th className="w-28">{t("status")}</Th>
                    <Th className="w-20" align="center">
                      {t("judgment")}
                    </Th>
                    <Th className="w-16" align="right" />
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((cs) => {
                    const slug =
                      TEMPLATE_REGISTRY.find((r) => r.code === cs.formCode)?.slug ?? "cs-01";
                    return (
                      <Tr
                        key={cs.id}
                        className="cursor-pointer"
                        onClick={(event) => {
                          if ((event.target as HTMLElement).closest("a, button, input")) return;
                          router.push(`/inspection/${slug}/${cs.id}`);
                        }}
                        tabIndex={0}
                        role="link"
                        aria-label={cs.number}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            router.push(`/inspection/${slug}/${cs.id}`);
                          }
                        }}
                      >
                        <Td>
                          <Link href={`/inspection/${slug}/${cs.id}`} className="relative after:absolute after:inset-0 after:content-['']">
                            <span className="relative z-[1] font-mono text-[11px] font-bold text-brand-600 group-hover:underline">
                              {cs.number}
                            </span>
                          </Link>
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
                          <span className="block text-xs font-medium text-ink-900">
                            {cs.partNo}
                          </span>
                          <span className="block text-[11px] text-ink-500">{cs.partName}</span>
                        </Td>
                        <Td>
                          <span className="font-mono text-[11px] text-ink-600">{cs.lotNo}</span>
                        </Td>
                        <Td>
                          <span className="text-xs whitespace-nowrap text-ink-600">
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
                        <Td align="right">
                          <Link href={`/inspection/${slug}/${cs.id}`}>
                            <Button variant="ghost" size="icon-sm" aria-label={t("open")}>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </TableWrap>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-ink-400">
        <span>{t("helper")}</span>
        <ArrowRight className="h-3 w-3" aria-hidden="true" />
      </div>
    </div>
  );
}
