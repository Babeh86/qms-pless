import type { Checksheet, ChecksheetStatus, Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { ForbiddenError, type AuthzContext } from "@/server/authz/guard";
import { writeAudit } from "@/server/audit/audit";
import type {
  ChecksheetCreateInput,
  ChecksheetListQuery,
  ChecksheetUpdateInput,
} from "@/lib/validation/checksheet";

/**
 * Durable check sheet persistence.
 *
 * Header/item JSON snapshots are immutable history: reopening an inspection must
 * not be rewritten by later master-data edits. Updates are only allowed for DRAFT.
 */

export type ChecksheetRecord = Omit<
  Checksheet,
  "createdAt" | "updatedAt" | "submittedAt" | "checkedAt" | "approvedAt"
> & {
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  checkedAt: string | null;
  approvedAt: string | null;
};

function toRecord(row: Checksheet): ChecksheetRecord {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    submittedAt: row.submittedAt?.toISOString() ?? null,
    checkedAt: row.checkedAt?.toISOString() ?? null,
    approvedAt: row.approvedAt?.toISOString() ?? null,
  };
}

function resolvePlant(ctx: AuthzContext, requestedPlantId?: string): string {
  const plantId = requestedPlantId ?? ctx.activePlantId ?? ctx.plantIds[0];
  if (!plantId) throw new ForbiddenError("Anda belum memiliki akses ke plant mana pun");
  if (!ctx.plantIds.includes(plantId)) {
    throw new ForbiddenError("Anda tidak memiliki akses ke plant ini");
  }
  return plantId;
}

function canBypassOwnership(ctx: AuthzContext): boolean {
  return (
    ctx.roles.some((role) => role.role === "ADMIN") || ctx.permissions.has("checksheet.view.all")
  );
}

function assertCanAccess(ctx: AuthzContext, ownerId: string, plantId: string): void {
  if (!ctx.plantIds.includes(plantId)) throw new ForbiddenError("Dokumen berada di plant lain");
  if (!canBypassOwnership(ctx) && ownerId !== ctx.userId) {
    throw new ForbiddenError("Anda hanya boleh mengakses checksheet milik sendiri");
  }
}

/**
 * Sequence number per plant/year. The unique `number` constraint is the final
 * arbiter under concurrency; the caller retries with a fresh sequence.
 */
async function nextNumber(plantId: string, year: number): Promise<string> {
  const plant = await prisma.plant.findUnique({ where: { id: plantId }, select: { code: true } });
  const plantCode = plant?.code ?? "UNK";
  const prefix = `CS/${year}/${plantCode}/`;
  const current = await prisma.checksheet.count({
    where: { plantId, number: { startsWith: prefix } },
  });
  return `${prefix}${String(current + 1).padStart(4, "0")}`;
}

export async function createChecksheet(
  ctx: AuthzContext,
  input: ChecksheetCreateInput,
  options: { plantId?: string; request?: Request } = {},
): Promise<ChecksheetRecord> {
  const plantId = resolvePlant(ctx, options.plantId);

  if (input.idempotencyKey) {
    const existing = await prisma.checksheet.findUnique({
      where: {
        createdById_idempotencyKey: {
          createdById: ctx.userId,
          idempotencyKey: input.idempotencyKey,
        },
      },
    });
    if (existing) return toRecord(existing);
  }

  const year = new Date().getUTCFullYear();
  const inspectionDate = new Date(`${input.inspectionDate}T00:00:00.000Z`);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const number = await nextNumber(plantId, year);
    try {
      const created = await prisma.checksheet.create({
        data: {
          number,
          formCode: input.formCode,
          formName: input.formName,
          templateRevision: input.templateRevision,
          plantId,
          createdById: ctx.userId,
          partNoSnapshot: input.partNo,
          partNameSnapshot: input.partName,
          ...(input.supplierSnapshot ? { supplierSnapshot: input.supplierSnapshot } : {}),
          ...(input.customerSnapshot ? { customerSnapshot: input.customerSnapshot } : {}),
          lotNoSnapshot: input.lotNo,
          inspectionDate,
          headerSnapshot: input.headerSnapshot as Prisma.InputJsonValue,
          itemSnapshot: input.itemSnapshot as Prisma.InputJsonValue,
          ...(input.remarksSnapshot
            ? { remarksSnapshot: input.remarksSnapshot as Prisma.InputJsonValue }
            : {}),
          totalItems: input.totalItems,
          ngItems: input.ngItems,
          finalJudgment: input.finalJudgment ?? null,
          ...(input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : {}),
        },
      });

      await writeAudit({
        action: "CREATE",
        entity: "Checksheet",
        entityId: created.id,
        summaryKey: "audit.checksheet.created",
        summaryParams: { number: created.number, formCode: created.formCode },
        actor: { id: ctx.userId, name: ctx.fullName },
        plantId,
        request: options.request ?? null,
      });

      return toRecord(created);
    } catch (error) {
      if ((error as { code?: string }).code !== "P2002" || attempt === 2) throw error;
      if (input.idempotencyKey) {
        const existing = await prisma.checksheet.findUnique({
          where: {
            createdById_idempotencyKey: {
              createdById: ctx.userId,
              idempotencyKey: input.idempotencyKey,
            },
          },
        });
        if (existing) return toRecord(existing);
      }
    }
  }

  throw new Error("Gagal membuat nomor checksheet unik");
}

export async function getChecksheet(
  ctx: AuthzContext,
  id: string,
): Promise<ChecksheetRecord | null> {
  const row = await prisma.checksheet.findUnique({ where: { id } });
  if (!row) return null;
  assertCanAccess(ctx, row.createdById, row.plantId);
  return toRecord(row);
}

export async function updateChecksheetDraft(
  ctx: AuthzContext,
  id: string,
  input: ChecksheetUpdateInput,
  options: { request?: Request } = {},
): Promise<ChecksheetRecord> {
  const row = await prisma.checksheet.findUnique({ where: { id } });
  if (!row) throw new ForbiddenError("Dokumen tidak ditemukan");
  assertCanAccess(ctx, row.createdById, row.plantId);
  if (!canBypassOwnership(ctx) && row.createdById !== ctx.userId) {
    throw new ForbiddenError("Hanya pemilik dokumen yang dapat mengubah draft");
  }
  if (row.status !== "DRAFT") throw new ForbiddenError("Hanya draft yang dapat diubah");

  const data: Prisma.ChecksheetUpdateInput = {
    ...(input.headerSnapshot
      ? { headerSnapshot: input.headerSnapshot as Prisma.InputJsonValue }
      : {}),
    ...(input.itemSnapshot ? { itemSnapshot: input.itemSnapshot as Prisma.InputJsonValue } : {}),
    ...(input.remarksSnapshot
      ? { remarksSnapshot: input.remarksSnapshot as Prisma.InputJsonValue }
      : {}),
    ...(input.totalItems !== undefined ? { totalItems: input.totalItems } : {}),
    ...(input.ngItems !== undefined ? { ngItems: input.ngItems } : {}),
    ...(input.finalJudgment !== undefined ? { finalJudgment: input.finalJudgment } : {}),
    ...(input.lotNo ? { lotNoSnapshot: input.lotNo } : {}),
    ...(input.inspectionDate
      ? { inspectionDate: new Date(`${input.inspectionDate}T00:00:00.000Z`) }
      : {}),
  };

  const updated = await prisma.checksheet.update({ where: { id, status: "DRAFT" }, data });

  await writeAudit({
    action: "UPDATE",
    entity: "Checksheet",
    entityId: updated.id,
    summaryKey: "audit.checksheet.updated",
    summaryParams: { number: updated.number },
    actor: { id: ctx.userId, name: ctx.fullName },
    plantId: updated.plantId,
    request: options.request ?? null,
  });

  return toRecord(updated);
}

export async function listChecksheets(
  ctx: AuthzContext,
  query: ChecksheetListQuery,
): Promise<{ items: ChecksheetRecord[]; total: number; page: number; pageSize: number }> {
  const canViewAll = ctx.permissions.has("checksheet.view.all");
  const where: Prisma.ChecksheetWhereInput = {
    plantId: { in: ctx.plantIds },
    ...(canViewAll ? {} : { createdById: ctx.userId }),
    ...(query.status ? { status: query.status as ChecksheetStatus } : {}),
    ...(query.formCode ? { formCode: query.formCode } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.checksheet.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.checksheet.count({ where }),
  ]);

  return { items: rows.map(toRecord), total, page: query.page, pageSize: query.pageSize };
}
