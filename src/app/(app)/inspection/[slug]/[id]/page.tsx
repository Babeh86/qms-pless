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
import { StoredAttachments, type StoredAttachmentView } from "./stored-attachments";
import {
  ChecksheetRecord,
  checksheetHeaderSnapshot,
  checksheetItemSnapshot,
} from "./checksheet-record";
import { requireSession } from "@/server/authz/guard";
import { getChecksheet } from "@/server/checksheet/checksheet-service";
import { listAttachments } from "@/server/checksheet/attachment-service";
import { listDecisions } from "@/server/checksheet/workflow-service";
import { allowedActions } from "@/lib/checksheet-workflow";
import { WorkflowPanel } from "./workflow-panel";

type ViewDocument = {
  id: string;
  number: string;
  status: "DRAFT" | "SUBMITTED" | "CHECKED" | "APPROVED" | "REJECTED" | "ARCHIVED";
  finalJudgment: "OK" | "NG" | null;
  inspectorName: string;
  checkedByName?: string;
  approvedByName?: string;
  totalItems: number;
  ngItems: number;
  lotNo: string;
  partNo: string;
  partName: string;
  supplierCode?: string;
  customerName?: string;
  machineNo?: string;
  inspectionDate: string;
  formCode: string;
  formName: string;
  headerSnapshot?: Record<string, string>;
  itemSnapshot?: Record<string, string>;
  remarksSnapshot?: Record<string, string>;
  /** Only populated for persisted documents. */
  persisted?: boolean;
};

/**
 * Prefers the persisted checksheet snapshot; falls back to bundled samples for
 * legacy demo documents. Authorization is enforced by the persistence service.
 */
async function loadDocument(id: string, formCode: string): Promise<ViewDocument | null> {
  try {
    const ctx = await requireSession();
    const persisted = await getChecksheet(ctx, id);
    if (persisted) {
      const user = await (await import("@/server/db/client")).prisma.user.findUnique({
        where: { id: persisted.createdById },
        select: { fullName: true },
      });
      return {
        id: persisted.id,
        number: persisted.number,
        status: persisted.status,
        finalJudgment: persisted.finalJudgment,
        inspectorName: user?.fullName ?? "—",
        totalItems: persisted.totalItems,
        ngItems: persisted.ngItems,
        lotNo: persisted.lotNoSnapshot,
        partNo: persisted.partNoSnapshot,
        partName: persisted.partNameSnapshot,
        ...(persisted.supplierSnapshot ? { supplierCode: persisted.supplierSnapshot } : {}),
        ...(persisted.customerSnapshot ? { customerName: persisted.customerSnapshot } : {}),
        inspectionDate: persisted.inspectionDate.toISOString().slice(0, 10),
        formCode: persisted.formCode,
        formName: persisted.formName,
        persisted: true,
        headerSnapshot: persisted.headerSnapshot as Record<string, string>,
        itemSnapshot: persisted.itemSnapshot as Record<string, string>,
        ...(persisted.remarksSnapshot
          ? { remarksSnapshot: persisted.remarksSnapshot as Record<string, string> }
          : {}),
      };
    }
  } catch {
    // Unauthenticated/forbidden: fall back only to bundled sample documents.
  }

  const sample = checksheets.find((entry) => entry.id === id && entry.formCode === formCode);
  return sample ? { ...sample, lotNo: sample.lotNo } : null;
}

/**
 * Bundled sample documents have no persisted snapshot, so generate the same
 * deterministic legacy view as before. Persisted documents always take their
 * own stored snapshot.
 */
function legacySnapshot(doc: ViewDocument): Record<string, string> {
  return checksheetHeaderSnapshot({
    id: doc.id,
    number: doc.number,
    formCode: doc.formCode,
    formName: doc.formName,
    category: "INCOMING",
    partNo: doc.partNo,
    partName: doc.partName,
    ...(doc.supplierCode ? { supplierCode: doc.supplierCode } : {}),
    ...(doc.customerName ? { customerName: doc.customerName } : {}),
    ...(doc.machineNo ? { machineNo: doc.machineNo } : {}),
    lotNo: doc.lotNo,
    inspectionDate: doc.inspectionDate,
    status: doc.status,
    finalJudgment: doc.finalJudgment,
    inspectorName: doc.inspectorName,
    ...(doc.checkedByName ? { checkedByName: doc.checkedByName } : {}),
    ...(doc.approvedByName ? { approvedByName: doc.approvedByName } : {}),
    totalItems: doc.totalItems,
    ngItems: doc.ngItems,
  });
}

function legacyItemSnapshot(
  doc: ViewDocument,
  template: Parameters<typeof checksheetItemSnapshot>[1],
): Record<string, string> {
  return checksheetItemSnapshot(
    {
      id: doc.id,
      number: doc.number,
      formCode: doc.formCode,
      formName: doc.formName,
      category: "INCOMING",
      partNo: doc.partNo,
      partName: doc.partName,
      ...(doc.supplierCode ? { supplierCode: doc.supplierCode } : {}),
      ...(doc.customerName ? { customerName: doc.customerName } : {}),
      ...(doc.machineNo ? { machineNo: doc.machineNo } : {}),
      lotNo: doc.lotNo,
      inspectionDate: doc.inspectionDate,
      status: doc.status,
      finalJudgment: doc.finalJudgment,
      inspectorName: doc.inspectorName,
      ...(doc.checkedByName ? { checkedByName: doc.checkedByName } : {}),
      ...(doc.approvedByName ? { approvedByName: doc.approvedByName } : {}),
      totalItems: doc.totalItems,
      ngItems: doc.ngItems,
    },
    template,
  );
}

export default async function SheetDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const meta = getTemplate(slug);
  if (!meta) notFound();

  const doc = await loadDocument(id, meta.code);
  if (!doc) notFound();

  const t = await getTranslations("form");
  const tIns = await getTranslations("inspection");

  let workflow: {
    actions: string[];
    decisions: Awaited<ReturnType<typeof listDecisions>>;
  } = { actions: [], decisions: [] };
  let attachments: StoredAttachmentView[] = [];
  if (doc.persisted) {
    try {
      const ctx = await requireSession();
      const rows = await listAttachments(ctx, doc.id);
      workflow = {
        actions: allowedActions(ctx.roles[0]?.role ?? "VIEWER", doc.status as never),
        decisions: await listDecisions(ctx, doc.id),
      };
      attachments = rows.map((row) => ({
        id: row.id,
        originalName: row.originalName,
        contentType: row.contentType,
        sizeBytes: row.sizeBytes,
        createdAt: row.createdAt,
      }));
    } catch {
      attachments = [];
    }
  }

  const part = parts.find((p) => p.partNo === doc.partNo);
  const material = part ? materialById(part.materialId) : undefined;

  // Persisted snapshots store display values; legacy samples store partner codes.
  const supplierLabel = doc.supplierCode
    ? (partnerByCode(doc.supplierCode)?.name ?? doc.supplierCode)
    : "";

  const headerValues: Record<string, string> = {
    partNo: doc.partNo,
    partName: doc.partName,
    supplier: supplierLabel,
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
    ...(doc.headerSnapshot ?? {}),
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
        <div className="flex flex-wrap items-end justify-between gap-2 px-1">          <div>
            <h2 className="text-sm font-bold text-ink-900">{meta.template.title}</h2>
            <p className="mt-0.5 text-[10px] text-ink-500">{t("readOnly")}</p>
          </div>
          <Badge tone={judgmentTone(doc.finalJudgment)}>{doc.finalJudgment ?? "—"}</Badge>
        </div>
        <ChecksheetRecord
          doc={{
            id: doc.id,
            number: doc.number,
            formCode: doc.formCode,
            formName: doc.formName,
            category: doc.formCode === "CS-01" || doc.formCode === "CS-02" || doc.formCode === "CS-03"
              ? "INCOMING"
              : "IN_PROCESS",
            partNo: doc.partNo,
            partName: doc.partName,
            ...(doc.supplierCode ? { supplierCode: doc.supplierCode } : {}),
            ...(doc.customerName ? { customerName: doc.customerName } : {}),
            ...(doc.machineNo ? { machineNo: doc.machineNo } : {}),
            lotNo: doc.lotNo,
            inspectionDate: doc.inspectionDate,
            status: doc.status,
            finalJudgment: doc.finalJudgment,
            inspectorName: doc.inspectorName,
            ...(doc.checkedByName ? { checkedByName: doc.checkedByName } : {}),
            ...(doc.approvedByName ? { approvedByName: doc.approvedByName } : {}),
            totalItems: doc.totalItems,
            ngItems: doc.ngItems,
            headerSnapshot: doc.headerSnapshot ?? legacySnapshot(doc),
            itemSnapshot: doc.itemSnapshot ?? legacyItemSnapshot(doc, meta.template),
            remarksSnapshot: doc.remarksSnapshot ?? {},
          }}
          template={meta.template}
        />
      </div>

      {doc.persisted ? (
        <WorkflowPanel
          checksheetId={doc.id}
          status={doc.status}
          actions={workflow.actions}
          decisions={workflow.decisions}
          labels={{
            title: t("workflowTitle"),
            noActions: t("workflowNoActions"),
            comment: t("workflowComment"),
            commentPlaceholder: t("workflowCommentPlaceholder"),
            commentRequired: t("workflowCommentRequired"),
            staleStatus: t("workflowStale"),
            forbidden: t("workflowForbidden"),
            failed: t("workflowFailed"),
            incomplete: t("workflowIncomplete"),
            validation: t("workflowValidation"),
            history: t("workflowHistory"),
            noHistory: t("workflowNoHistory"),
            SUBMIT: t("actionSubmit"),
            CHECK: t("actionCheck"),
            APPROVE: t("actionApprove"),
            REJECT: t("actionReject"),
            RETURN: t("actionReturn"),
          }}
        />
      ) : null}

      {doc.persisted ? (
        <StoredAttachments
          checksheetId={doc.id}
          items={attachments}
          labels={{
            title: t("attachmentsTitle"),
            empty: t("noStoredAttachments"),
            download: t("downloadAttachment"),
          }}
        />
      ) : null}

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
