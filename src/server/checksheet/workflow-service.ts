import type {
  Checksheet,
  ChecksheetDecisionAction,
  ChecksheetStatus,
  RoleCode,
} from "@prisma/client";
import { prisma } from "@/server/db/client";
import { AppError, ForbiddenError, type AuthzContext } from "@/server/authz/guard";
import { writeAudit } from "@/server/audit/audit";
import {
  allowedActions,
  canSubmitCompletely,
  nextStatusFor,
  requiresComment,
  type TransitionAction,
} from "@/lib/checksheet-workflow";

/**
 * Approval transitions. Concurrency safety comes from a conditional update on
 * the current status: if another actor already moved the document, zero rows are
 * updated and the request is rejected rather than overwriting history.
 */

const ACTION_TO_DECISION: Record<TransitionAction, ChecksheetDecisionAction> = {
  SUBMIT: "SUBMIT",
  CHECK: "CHECK",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  RETURN: "RETURN",
};

const AUDIT_KEY: Record<TransitionAction, string> = {
  SUBMIT: "audit.checksheet.submitted",
  CHECK: "audit.checksheet.checked",
  APPROVE: "audit.checksheet.approved",
  REJECT: "audit.checksheet.rejected",
  RETURN: "audit.checksheet.returned",
};

function isJsonFilled(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).some(
    (entry) => typeof entry === "string" && entry.trim() !== "",
  );
}

/**
 * Only required header fields are validated. Derived/optional fields (model,
 * mold, drawing revision) may legitimately be empty for a given part.
 */
const REQUIRED_HEADER_KEYS = [
  "partNo",
  "partName",
  "supplier",
  "customer",
  "machineNo",
  "date",
  "inspectionDate",
  "lotNo",
] as const;

function assertSubmitComplete(row: Checksheet): void {
  const header = row.headerSnapshot as Record<string, string>;
  const items = row.itemSnapshot as Record<string, string>;

  const headerMissing = REQUIRED_HEADER_KEYS.filter(
    (key) => header[key] !== undefined && (header[key] ?? "").trim() === "",
  ).length;

  const complete = canSubmitCompletely({
    headerMissing,
    requiredItems: row.totalItems,
    filledItems: Object.values(items).filter((value) => value.trim() !== "").length,
  });

  if (!complete || !isJsonFilled(row.headerSnapshot)) {
    throw new AppError("VALIDATION", "Checksheet belum lengkap untuk disubmit", 422);
  }
}

export interface DecisionResult {
  status: ChecksheetStatus;
  decisionId: string;
}

export async function transitionChecksheet(
  ctx: AuthzContext,
  id: string,
  action: TransitionAction,
  comment: string | undefined,
  options: { request?: Request } = {},
): Promise<DecisionResult> {
  const row = await prisma.checksheet.findUnique({ where: { id } });
  if (!row) throw new AppError("NOT_FOUND", "Checksheet tidak ditemukan", 404);
  if (!ctx.plantIds.includes(row.plantId)) throw new ForbiddenError("Dokumen berada di plant lain");

  const role = ctx.roles[0]?.role ?? "VIEWER";
  const permitted = allowedActions(role, row.status);
  if (!permitted.includes(action)) {
    throw new ForbiddenError(`Aksi ${action} tidak diizinkan untuk status ${row.status}`);
  }

  if (requiresComment(action) && !comment?.trim()) {
    throw new AppError("VALIDATION", "Komentar wajib diisi untuk aksi ini", 422);
  }

  if (action === "SUBMIT") {
    assertSubmitComplete(row);
  }

  const toStatus = nextStatusFor(action);
  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.checksheet.updateMany({
      where: { id, status: row.status },
      data: {
        status: toStatus,
        ...(action === "SUBMIT" ? { submittedAt: now } : {}),
        ...(action === "CHECK"
          ? { checkedById: ctx.userId, checkedAt: now }
          : {}),
        ...(action === "APPROVE" ? { approvedById: ctx.userId, approvedAt: now } : {}),
      },
    });

    if (result.count === 0) {
      throw new AppError("VALIDATION", "Status dokumen sudah berubah; muat ulang lalu coba lagi", 409);
    }

    const decision = await tx.checksheetDecision.create({
      data: {
        checksheetId: id,
        actorId: ctx.userId,
        actorName: ctx.fullName,
        actorRole: role,
        action: ACTION_TO_DECISION[action],
        fromStatus: row.status,
        toStatus,
        ...(comment?.trim() ? { comment: comment.trim() } : {}),
      },
    });

    return decision;
  });

  await writeAudit({
    action:
      action === "APPROVE" ? "APPROVE" : action === "REJECT" ? "REJECT" : "SUBMIT",
    entity: "Checksheet",
    entityId: id,
    summaryKey: AUDIT_KEY[action],
    summaryParams: { number: row.number, from: row.status, to: toStatus },
    ...(comment?.trim() ? { metadata: { comment: comment.trim() } } : {}),
    actor: { id: ctx.userId, name: ctx.fullName },
    plantId: row.plantId,
    request: options.request ?? null,
  });

  return { status: toStatus, decisionId: updated.id };
}

export interface DecisionRecord {
  id: string;
  actorName: string;
  actorRole: RoleCode;
  action: ChecksheetDecisionAction;
  fromStatus: ChecksheetStatus;
  toStatus: ChecksheetStatus;
  comment: string | null;
  at: string;
}

export async function listDecisions(
  ctx: AuthzContext,
  checksheetId: string,
): Promise<DecisionRecord[]> {
  const row = await prisma.checksheet.findUnique({ where: { id: checksheetId } });
  if (!row) throw new AppError("NOT_FOUND", "Checksheet tidak ditemukan", 404);
  if (!ctx.plantIds.includes(row.plantId)) throw new ForbiddenError("Dokumen berada di plant lain");

  const canViewAll = ctx.permissions.has("checksheet.view.all");
  if (!canViewAll && row.createdById !== ctx.userId) {
    throw new ForbiddenError("Anda hanya boleh mengakses checksheet milik sendiri");
  }

  const rows = await prisma.checksheetDecision.findMany({
    where: { checksheetId },
    orderBy: { at: "asc" },
  });

  return rows.map((decision) => ({
    id: decision.id,
    actorName: decision.actorName,
    actorRole: decision.actorRole,
    action: decision.action,
    fromStatus: decision.fromStatus,
    toStatus: decision.toStatus,
    comment: decision.comment,
    at: decision.at.toISOString(),
  }));
}

/** Records pending approval queue from persisted data (not mock fixtures). */
export async function listApprovalQueue(
  ctx: AuthzContext,
  status: "SUBMITTED" | "CHECKED",
): Promise<Checksheet[]> {
  return prisma.checksheet.findMany({
    where: { plantId: { in: ctx.plantIds }, status },
    orderBy: { submittedAt: "asc" },
    take: 100,
  });
}
