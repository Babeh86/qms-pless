import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  FileSpreadsheet,
  Table2,
  Grid3x3,
  Boxes,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { TEMPLATE_REGISTRY } from "@/lib/mock/templates";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

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

export default async function TemplatePage() {
  const t = await getTranslations("templatePage");
  const tLit = await getTranslations("lit");

  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/template" className="group rounded-xl focus-visible:outline-2 focus-visible:outline-brand-500">
        <Card className="transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md">
          <CardContent className="flex items-center gap-3 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] text-ink-500">{t("total")}</p>
              <p className="text-lg font-bold text-ink-900 tabular">{TEMPLATE_REGISTRY.length}</p>
            </div>
          </CardContent>
        </Card>
        </Link>
        <Link href="/template" className="group rounded-xl focus-visible:outline-2 focus-visible:outline-brand-500">
        <Card className="transition hover:-translate-y-0.5 hover:border-success-500/40 hover:shadow-md">
          <CardContent className="flex items-center gap-3 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-50 text-success-600">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] text-ink-500">{t("active")}</p>
              <p className="text-lg font-bold text-ink-900 tabular">{TEMPLATE_REGISTRY.length}</p>
            </div>
          </CardContent>
        </Card>
        </Link>
        <Link href="/template" className="group rounded-xl focus-visible:outline-2 focus-visible:outline-brand-500">
        <Card className="transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md">
          <CardContent className="flex items-center gap-3 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Grid3x3 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[11px] text-ink-500">{t("layouts")}</p>
              <p className="text-lg font-bold text-ink-900 tabular">3</p>
            </div>
          </CardContent>
        </Card>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TEMPLATE_REGISTRY.map((meta) => {
          const Icon = LAYOUT_ICON[meta.template.layout];
          const tone = LAYOUT_TONE[meta.template.layout];
          const itemCount =
            meta.template.layout === "FLAT_TABLE"
              ? meta.template.sections.reduce((s, sec) => s + sec.items.length, 0)
              : meta.template.layout === "MATRIX_TIME"
                ? 19
                : 18;

          return (
            <Link key={meta.slug} href={`/inspection/${meta.slug}`} className="group">
              <Card className="h-full transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md">
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink-100 text-ink-500 transition-colors group-hover:bg-brand-100 group-hover:text-brand-600">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <Badge tone={tone}>{meta.template.layout}</Badge>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-ink-500">
                        {meta.code}
                      </span>
                      <Badge tone="success" dot>
                        {t("activeLabel")}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm font-semibold text-ink-900">
                      {meta.template.title}
                    </p>
                  </div>

                  <div className="space-y-1 border-t border-ink-100 pt-2.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-ink-400">{tLit("docNoShort")}</span>
                      <span className="font-mono font-medium text-ink-700">
                        {meta.template.docNo}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-400">{tLit("effectiveShort")}</span>
                      <span className="text-ink-700">{meta.template.effectiveDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-400">{t("items")}</span>
                      <span className="text-ink-700">{itemCount}</span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 pt-1 text-[11px] font-semibold text-brand-600">
                    {t("open")}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
