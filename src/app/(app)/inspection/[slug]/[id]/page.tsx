import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, ShieldCheck, CheckCircle2, Clock3 } from "lucide-react";
import { getTemplate } from "@/lib/mock/templates";
import { checksheets, materialById, partnerByCode, parts } from "@/lib/mock/data";
import { Badge, judgmentTone, statusTone } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { DocumentActions } from "./document-actions";
import {
  ChecksheetRecord,
  checksheetHeaderSnapshot,
  checksheetItemSnapshot,
} from "./checksheet-record";

export default async function SheetDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const meta = getTemplate(slug);
  if (!meta) notFound();

  const doc = checksheets.find((c) => c.id === id);
  if (!doc) notFound();

  const t = await getTranslations("form");
  const tIns = await getTranslations("inspection");

  const part = parts.find((p) => p.partNo === doc.partNo);
  const material = part ? materialById(part.materialId) : undefined;

  const headerValues: Record<string, string> = {
    partNo: doc.partNo,
    partName: doc.partName,
    supplier: partnerByCode(doc.supplierCode)?.name ?? doc.supplierCode ?? "",
    customer: doc.customerName ?? "",
    material: material
      ? [material.name, material.additiveMasterbatch, material.color].filter(Boolean).join(" ")
      : "",
    color: material?.color ?? "",
    model: part?.model ?? "",
    cavity: part ? String(part.defaultCavityCount) : "",
    moldCode: part?.moldCode ?? "",
    drawingRev: part?.drawingRev ?? "",
    machineNo: doc.machineNo ?? "",
    lotNo: doc.lotNo,
    inspectionDate: doc.inspectionDate,
    date: doc.inspectionDate,
    ...checksheetHeaderSnapshot(doc),
  };

  const steps = [
    { key: "DRAFT", label: "Draft" },
    { key: "SUBMITTED", label: "Submitted" },
    { key: "CHECKED", label: "Checked" },
    { key: "APPROVED", label: "Approved" },
  ];
  const currentIdx = steps.findIndex((s) => s.key === doc.status);

  return (
    <div className="space-y-4" data-print-document>
      <Link
        href={`/inspection/${slug}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 transition-colors hover:text-brand-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {t("backToList")}
      </Link>

      <PageHeader
        title={doc.number}
        description={`${doc.formCode} — ${doc.formName}`}
        actions={<DocumentActions printLabel={t("print")} />}
      />

      {/* Status stepper */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-4">
          <Badge tone={statusTone(doc.status)} dot>
            {doc.status}
          </Badge>
          <div className="ml-2 flex flex-1 flex-wrap items-center gap-1">
            {steps.map((s, i) => {
              const done = currentIdx >= 0 && i <= currentIdx;
              return (
                <span key={s.key} className="flex items-center gap-1">
                  <span
                    className={
                      "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold " +
                      (done ? "bg-success-50 text-success-700" : "bg-ink-100 text-ink-400")
                    }
                  >
                    {done ? (
                      <CheckCircle2 className="h-2.5 w-2.5" aria-hidden="true" />
                    ) : (
                      <Clock3 className="h-2.5 w-2.5" aria-hidden="true" />
                    )}
                    {s.label}
                  </span>
                  {i < steps.length - 1 ? (
                    <span className="text-ink-300" aria-hidden="true">
                      →
                    </span>
                  ) : null}
                </span>
              );
            })}
          </div>
          <Badge tone={judgmentTone(doc.finalJudgment)}>{doc.finalJudgment ?? "—"}</Badge>
        </CardContent>
      </Card>

      {/* Header dokumen (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle>{t("header")}</CardTitle>
          <Badge tone="neutral">{t("readOnly")}</Badge>
        </CardHeader>
        <CardContent className="grid gap-x-6 gap-y-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {meta.template.header.map((field) => {
            const raw = headerValues[field.key] ?? "";
            return (
              <div key={field.key} className="min-w-0">
                <p className="text-[10px] font-semibold tracking-wider text-ink-400 uppercase">
                  {field.label}
                </p>
                <p className="mt-1 truncate text-[13px] font-semibold text-ink-900">
                  {raw || <span className="font-normal text-ink-300 italic">—</span>}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-2 px-1">
          <div>
            <h2 className="text-sm font-bold text-ink-900">{meta.template.title}</h2>
            <p className="mt-0.5 text-[10px] text-ink-500">{t("readOnly")}</p>
          </div>
          <Badge tone={judgmentTone(doc.finalJudgment)}>{doc.finalJudgment ?? "—"}</Badge>
        </div>
        <ChecksheetRecord
          doc={{
            ...doc,
            headerSnapshot: checksheetHeaderSnapshot(doc),
            itemSnapshot: checksheetItemSnapshot(doc, meta.template),
          }}
          template={meta.template}
        />
      </div>

      {/* Ringkasan item */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-[10px] font-semibold tracking-wider text-ink-400 uppercase">
              {tIns("totalItems")}
            </p>
            <p className="mt-1 text-2xl font-bold text-ink-900 tabular">{doc.totalItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-[10px] font-semibold tracking-wider text-ink-400 uppercase">
              {tIns("ngItems")}
            </p>
            <p className="mt-1 text-2xl font-bold text-danger-600 tabular">{doc.ngItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-[10px] font-semibold tracking-wider text-ink-400 uppercase">
              {tIns("inspector")}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-ink-900">{doc.inspectorName}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tanda tangan */}
      <Card>
        <CardHeader>
          <CardTitle>{t("signatures")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {[
            { label: t("inspector"), name: doc.inspectorName, ok: true },
            { label: t("checked"), name: doc.checkedByName ?? "—", ok: Boolean(doc.checkedByName) },
            {
              label: t("approved"),
              name: doc.approvedByName ?? "—",
              ok: Boolean(doc.approvedByName),
            },
          ].map((sig) => (
            <div
              key={sig.label}
              className={
                "rounded-lg border px-3 py-4 text-center " +
                (sig.ok
                  ? "border-success-500/30 bg-success-50"
                  : "border-dashed border-ink-300 bg-ink-50/50")
              }
            >
              <p className="text-[10px] font-semibold tracking-wider text-ink-400 uppercase">
                {sig.label}
              </p>
              <ShieldCheck
                className={"mx-auto mt-2 h-4 w-4 " + (sig.ok ? "text-success-600" : "text-ink-300")}
                aria-hidden="true"
              />
              <p className="mt-1 text-[11px] font-medium text-ink-700">{sig.name}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="rounded-md border border-ink-200 bg-white px-3 py-2 text-[11px] text-ink-500">
        {t("notes")}: {meta.template.notes[0]}
      </p>
    </div>
  );
}
