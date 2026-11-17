import { prisma } from "@/server/db/client";
import type { AuditAction, Prisma } from "@prisma/client";

/**
 * Audit trail append-only (SPEC-0001 §8).
 *
 * - `summaryKey` disimpan sebagai kunci i18n + params, dirender sesuai locale saat dibaca.
 * - `actorName` disimpan sebagai snapshot agar log tetap terbaca walau user dihapus.
 * - Untuk aksi kritikal, kegagalan menulis audit MENGGAGALKAN mutasi (fail-closed).
 */

/** Aksi yang wajib fail-closed bila audit gagal ditulis. */
const CRITICAL_ACTIONS: ReadonlySet<AuditAction> = new Set<AuditAction>([
  "APPROVE",
  "REJECT",
  "DELETE",
  "SOFT_DELETE",
  "IMPORT",
]);

export interface AuditActor {
  id: string;
  name: string;
}

export interface WriteAuditInput {
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  summaryKey: string;
  summaryParams?: Record<string, unknown> | undefined;
  metadata?: Record<string, unknown> | undefined;
  actor?: AuditActor | null;
  plantId?: string | null;
  request?: Request | null;
}

function extractRequestMeta(request?: Request | null): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  if (!request) return { ipAddress: null, userAgent: null };

  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  const ipAddress = forwarded
    ? (forwarded.split(",")[0]?.trim() ?? null)
    : headers.get("x-real-ip");

  return {
    ipAddress: ipAddress ?? null,
    userAgent: headers.get("user-agent"),
  };
}

/**
 * Menulis satu entri audit.
 * @throws Error bila penulisan gagal pada aksi kritikal
 */
export async function writeAudit(input: WriteAuditInput): Promise<void> {
  const { ipAddress, userAgent } = extractRequestMeta(input.request);

  const data: Prisma.AuditLogCreateInput = {
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ?? null,
    summaryKey: input.summaryKey,
    ...(input.summaryParams !== undefined
      ? { summaryParams: input.summaryParams as Prisma.InputJsonValue }
      : {}),
    ...(input.metadata !== undefined
      ? { metadata: input.metadata as Prisma.InputJsonValue }
      : {}),
    actorName: input.actor?.name ?? null,
    ipAddress,
    userAgent,
    ...(input.actor ? { actor: { connect: { id: input.actor.id } } } : {}),
    ...(input.plantId ? { plant: { connect: { id: input.plantId } } } : {}),
  };

  try {
    await prisma.auditLog.create({ data });
  } catch (error) {
    if (CRITICAL_ACTIONS.has(input.action)) {
      throw new Error(
        `Gagal menulis audit trail untuk aksi kritikal ${input.action}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    // Aksi non-kritikal: catat ke stderr tapi jangan gagalkan permintaan.
    console.error("[audit] gagal menulis log", {
      action: input.action,
      entity: input.entity,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export interface AuditQuery {
  from?: Date;
  to?: Date;
  actorId?: string;
  entity?: string;
  action?: AuditAction;
  page?: number;
  pageSize?: number;
}

export interface AuditListResult {
  items: {
    id: string;
    at: Date;
    actorId: string | null;
    actorName: string | null;
    action: AuditAction;
    entity: string;
    entityId: string | null;
    summaryKey: string;
    summaryParams: unknown;
    ipAddress: string | null;
  }[];
  total: number;
  page: number;
  pageSize: number;
}

/** Membaca log audit dengan filter & paginasi. Read-only. */
export async function listAudit(query: AuditQuery = {}): Promise<AuditListResult> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, query.pageSize ?? 50));

  const where: Prisma.AuditLogWhereInput = {
    ...(query.from || query.to
      ? {
          at: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {}),
          },
        }
      : {}),
    ...(query.actorId ? { actorId: query.actorId } : {}),
    ...(query.entity ? { entity: query.entity } : {}),
    ...(query.action ? { action: query.action } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        at: true,
        actorId: true,
        actorName: true,
        action: true,
        entity: true,
        entityId: true,
        summaryKey: true,
        summaryParams: true,
        ipAddress: true,
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    items: rows.map((r) => ({ ...r, id: r.id.toString() })),
    total,
    page,
    pageSize,
  };
}
