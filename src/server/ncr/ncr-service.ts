import type { Ncr, NcrStatus, Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { AppError, ForbiddenError, type AuthzContext } from "@/server/authz/guard";
import { writeAudit } from "@/server/audit/audit";
import {
  ncrAllowedActions,
  ncrMissingFields,
  ncrNextStatus,
  ncrRequiresNote,
  type NcrActionInput,
} from "@/lib/ncr-workflow";
import type { NcrCreateInput, NcrListQuery, NcrTransitionInput } from "@/lib/validation/checksheet";

/**
 * NCR / CAPA persistence. Creating an NCR from an inspection finding requires the
 * linked checksheet item to actually be judged NG, so the register cannot be filled
 * with records that have no non-conformance behind them.
 */

export interface NcrRecord {
  id: string;
  number: string;
  checksheetId: string | null;
  checksheetItemKey: string | null;
  partNo: string;
  partName: string;
  lotNo: string;
  defectType: string;
  defectLocation: string | null;
  severity: string;
  description: string;
  containment: string | null;
  rootCause: string | null;
  correctiveAction: string | null;
  preventiveAction: string | null;
  verification: string | null;
  picName: string | null;
  targetDate: string | null;
  status: NcrStatus;
  createdAt: string;
  closedAt: string | null;
  overdue: boolean;
}

function toRecord(row: Ncr, now = new Date()): NcrRecord {
  return {
    id: row.id,
    number: row.number,
    checksheetId: row.checksheetId,
    checksheetItemKey: row.checksheetItemKey,
    partNo: row.partNo,
    partName: row.partName,
    lotNo: row.lotNo,
    defectType: row.defectType,
    defectLocation: row.defectLocation,
    severity: row.severity,
    description: row.description,
    containment: row.containment,
    rootCause: row.rootCause,
    correctiveAction: row.correctiveAction,
    preventiveAction: row.preventiveAction,
    verification: row.verification,
    picName: row.picName,
    targetDate: row.targetDate?.toISOString().slice(0, 10) ?? null,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    closedAt: row.closedAt?.toISOString() ?? null,
    overdue:
      !!row.targetDate &&
      row.status !== "CLOSED" &&
      row.status !== "CANCELLED" &&
      row.targetDate.getTime() < now.getTime(),
  };
}

async function nextNcrNumber(plantId: string, year: number): Promise<string> {
  const plant = await prisma.plant.findUnique({ where: { id: plantId }, select: { code: true } });
  const prefix = `NCR/${year}/${plant?.code ?? "UNK"}/`;
  const count = await prisma.ncr.count({ where: { plantId, number: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

export async function createNcr(
  ctx: AuthzContext,
  input: NcrCreateInput,
  options: { plantId?: string; request?: Request } = {},
): Promise<NcrRecord> {
  const plantId = options.plantId ?? ctx.activePlantId ?? ctx.plantIds[0];
  if (!plantId || !ctx.plantIds.includes(plantId)) {
    throw new ForbiddenError("Anda tidak memiliki akses ke plant ini");
  }

  if (input.checksheetId) {
    const checksheet = await prisma.checksheet.findUnique({ where: { id: input.checksheetId } });
    if (!checksheet) throw new AppError("NOT_FOUND", "Checksheet sumber tidak ditemukan", 404);
    if (checksheet.plantId !== plantId) throw new ForbiddenError("Checksheet berada di plant lain");

    if (input.checksheetItemKey) {
      const items = checksheet.itemSnapshot as Record<string, string>;
      if (!Object.prototype.hasOwnProperty.call(items, input.checksheetItemKey)) {
        throw new AppError("VALIDATION", "Item sumber tidak ada pada checksheet", 422);
      }
      if (items[input.checksheetItemKey]?.trim().toUpperCase() !== "NG") {
        throw new AppError("VALIDATION", "NCR hanya dapat dibuat dari item berstatus NG", 422);
      }
    }
  }

  const year = new Date().getUTCFullYear();
  const targetDate = input.targetDate ? new Date(`${input.targetDate}T00:00:00.000Z`) : null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const number = await nextNcrNumber(plantId, year);
    try {
      const created = await prisma.ncr.create({
        data: {
          number,
          plantId,
          createdById: ctx.userId,
          ...(input.checksheetId ? { checksheetId: input.checksheetId } : {}),
          ...(input.checksheetItemKey ? { checksheetItemKey: input.checksheetItemKey } : {}),
          partNo: input.partNo,
          partName: input.partName,
          lotNo: input.lotNo,
          defectType: input.defectType,
          ...(input.defectLocation ? { defectLocation: input.defectLocation } : {}),
          severity: input.severity,
          description: input.description,
          ...(input.containment ? { containment: input.containment } : {}),
          ...(input.picName ? { picName: input.picName } : {}),
          ...(targetDate ? { targetDate } : {}),
          events: {
            create: {
              actorId: ctx.userId,
              actorName: ctx.fullName,
              actorRole: ctx.roles[0]?.role ?? "INSPECTOR",
              action: "CREATE",
              fromStatus: "OPEN",
              toStatus: "OPEN",
              note: "NCR dibuat dari temuan NG",
            },
          },
        },
      });

      await writeAudit({
        action: "CREATE",
        entity: "Ncr",
        entityId: created.id,
        summaryKey: "audit.ncr.created",
        summaryParams: { number: created.number, severity: created.severity },
        actor: { id: ctx.userId, name: ctx.fullName },
        plantId,
        request: options.request ?? null,
      });

      return toRecord(created);
    } catch (error) {
      if ((error as { code?: string }).code !== "P2002" || attempt === 2) throw error;
    }
  }

  throw new Error("Gagal membuat nomor NCR unik");
}

async function loadNcr(ctx: AuthzContext, id: string): Promise<Ncr> {
  const row = await prisma.ncr.findUnique({ where: { id } });
  if (!row) throw new AppError("NOT_FOUND", "NCR tidak ditemukan", 404);
  if (!ctx.plantIds.includes(row.plantId)) throw new ForbiddenError("NCR berada di plant lain");
  return row;
}

export async function getNcr(ctx: AuthzContext, id: string): Promise<NcrRecord> {
  return toRecord(await loadNcr(ctx, id));
}

export async function listNcrs(
  ctx: AuthzContext,
  query: NcrListQuery,
): Promise<{ items: NcrRecord[]; total: number; page: number; pageSize: number }> {
  const where: Prisma.NcrWhereInput = {
    plantId: { in: ctx.plantIds },
    ...(query.status ? { status: query.status } : {}),
    ...(query.severity ? { severity: query.severity } : {}),
    ...(query.checksheetId ? { checksheetId: query.checksheetId } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.ncr.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.ncr.count({ where }),
  ]);

  return { items: rows.map((row) => toRecord(row)), total, page: query.page, pageSize: query.pageSize };
}

export async function transitionNcr(
  ctx: AuthzContext,
  id: string,
  input: NcrTransitionInput,
  options: { request?: Request } = {},
): Promise<NcrRecord> {
  // Defense in depth: authorization must not rely on the route layer alone.
  if (!ctx.permissions.has("ncr.manage")) {
    throw new ForbiddenError("Anda tidak berwenang mengelola NCR/CAPA");
  }

  const row = await loadNcr(ctx, id);

  if (!ncrAllowedActions(row.status).includes(input.action)) {
    throw new AppError(
      "VALIDATION",
      `Aksi ${input.action} tidak diizinkan untuk status ${row.status}`,
      409,
    );
  }

  if (ncrRequiresNote(input.action) && !input.note?.trim()) {
    throw new AppError("VALIDATION", "Catatan wajib diisi untuk aksi ini", 422);
  }

  const existing: NcrActionInput = {
    ...(row.containment ? { containment: row.containment } : {}),
    ...(row.rootCause ? { rootCause: row.rootCause } : {}),
    ...(row.correctiveAction ? { correctiveAction: row.correctiveAction } : {}),
    ...(row.verification ? { verification: row.verification } : {}),
  };
  const missing = ncrMissingFields(input.action, existing, input);
  if (missing.length > 0) {
    throw new AppError("VALIDATION", `Field wajib belum diisi: ${missing.join(", ")}`, 422);
  }

  const toStatus = ncrNextStatus(input.action);
  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.ncr.updateMany({
      where: { id, status: row.status },
      data: {
        status: toStatus,
        ...(input.containment ? { containment: input.containment } : {}),
        ...(input.rootCause ? { rootCause: input.rootCause } : {}),
        ...(input.correctiveAction ? { correctiveAction: input.correctiveAction } : {}),
        ...(input.preventiveAction ? { preventiveAction: input.preventiveAction } : {}),
        ...(input.verification ? { verification: input.verification } : {}),
        ...(input.picName ? { picName: input.picName } : {}),
        ...(input.targetDate
          ? { targetDate: new Date(`${input.targetDate}T00:00:00.000Z`) }
          : {}),
        ...(toStatus === "CLOSED" ? { closedAt: now } : {}),
      },
    });

    if (result.count === 0) {
      throw new AppError("VALIDATION", "Status NCR sudah berubah; muat ulang lalu coba lagi", 409);
    }

    await tx.ncrEvent.create({
      data: {
        ncrId: id,
        actorId: ctx.userId,
        actorName: ctx.fullName,
        actorRole: ctx.roles[0]?.role ?? "INSPECTOR",
        action: input.action,
        fromStatus: row.status,
        toStatus,
        ...(input.note?.trim() ? { note: input.note.trim() } : {}),
      },
    });

    return tx.ncr.findUniqueOrThrow({ where: { id } });
  });

  await writeAudit({
    action: toStatus === "CLOSED" ? "APPROVE" : "UPDATE",
    entity: "Ncr",
    entityId: id,
    summaryKey: "audit.ncr.transitioned",
    summaryParams: { number: row.number, action: input.action, to: toStatus },
    actor: { id: ctx.userId, name: ctx.fullName },
    plantId: row.plantId,
    request: options.request ?? null,
  });

  return toRecord(updated);
}

export async function listNcrEvents(ctx: AuthzContext, id: string) {
  await loadNcr(ctx, id);
  const rows = await prisma.ncrEvent.findMany({ where: { ncrId: id }, orderBy: { at: "asc" } });
  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    actorName: row.actorName,
    actorRole: row.actorRole,
    fromStatus: row.fromStatus,
    toStatus: row.toStatus,
    note: row.note,
    at: row.at.toISOString(),
  }));
}
