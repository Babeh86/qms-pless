import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/client";
import { AppError, type AuthzContext } from "@/server/authz/guard";
import { writeAudit } from "@/server/audit/audit";
import {
  getSignedAttachmentUrl,
  putAttachment,
  StorageNotConfiguredError,
} from "@/server/storage/object-storage";
import { assertUploadAllowed } from "@/server/checksheet/attachment-policy";
import { getChecksheet } from "@/server/checksheet/checksheet-service";

/**
 * Attachment handling: binary -> S3-compatible storage, metadata -> database.
 * Metadata is only written after the object was stored successfully.
 */

export interface AttachmentRecord {
  id: string;
  checksheetId: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

export class StorageUnavailableError extends AppError {
  constructor() {
    super("INTERNAL", "Object storage belum dikonfigurasi", 503);
  }
}

function toRecord(row: {
  id: string;
  checksheetId: string;
  originalName: string;
  contentType: string;
  sizeBytes: bigint;
  createdAt: Date;
}): AttachmentRecord {
  return {
    id: row.id,
    checksheetId: row.checksheetId,
    originalName: row.originalName,
    contentType: row.contentType,
    sizeBytes: Number(row.sizeBytes),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function uploadAttachment(
  ctx: AuthzContext,
  checksheetId: string,
  file: { fileName: string; contentType: string; bytes: Buffer },
  options: { request?: Request } = {},
): Promise<AttachmentRecord> {
  const checksheet = await getChecksheet(ctx, checksheetId);
  if (!checksheet) throw new AppError("NOT_FOUND", "Checksheet tidak ditemukan", 404);
  assertUploadAllowed(file.fileName, file.contentType, file.bytes.byteLength);

  let stored;
  try {
    stored = await putAttachment({
      checksheetId,
      userId: ctx.userId,
      fileName: file.fileName,
      contentType: file.contentType,
      bytes: file.bytes,
    });
  } catch (error) {
    if (error instanceof StorageNotConfiguredError) throw new StorageUnavailableError();
    throw error;
  }

  const created = await prisma.checksheetAttachment.create({
    data: {
      checksheetId,
      uploadedById: ctx.userId,
      originalName: file.fileName,
      contentType: file.contentType,
      sizeBytes: BigInt(stored.sizeBytes),
      checksumSha256: stored.checksumSha256,
      objectKey: stored.objectKey,
    },
  });

  await writeAudit({
    action: "CREATE",
    entity: "ChecksheetAttachment",
    entityId: created.id,
    summaryKey: "audit.attachment.uploaded",
    summaryParams: { name: created.originalName },
    actor: { id: ctx.userId, name: ctx.fullName },
    plantId: checksheet.plantId,
    request: options.request ?? null,
  });

  return toRecord(created);
}

export async function listAttachments(
  ctx: AuthzContext,
  checksheetId: string,
): Promise<AttachmentRecord[]> {
  const checksheet = await getChecksheet(ctx, checksheetId);
  if (!checksheet) throw new AppError("NOT_FOUND", "Checksheet tidak ditemukan", 404);

  const rows = await prisma.checksheetAttachment.findMany({
    where: { checksheetId },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toRecord);
}

export async function getAttachmentDownloadUrl(
  ctx: AuthzContext,
  checksheetId: string,
  attachmentId: string,
): Promise<{ url: string; fileName: string }> {
  const checksheet = await getChecksheet(ctx, checksheetId);
  if (!checksheet) throw new AppError("NOT_FOUND", "Checksheet tidak ditemukan", 404);

  const row = await prisma.checksheetAttachment.findFirst({
    where: { id: attachmentId, checksheetId },
  });
  if (!row) throw new AppError("NOT_FOUND", "Lampiran tidak ditemukan", 404);

  try {
    const signed = await getSignedAttachmentUrl(row.objectKey);
    return {
      url: signed ?? `/api/checksheets/${checksheetId}/attachments/${attachmentId}/content`,
      fileName: row.originalName,
    };
  } catch (error) {
    if (error instanceof StorageNotConfiguredError) throw new StorageUnavailableError();
    throw error;
  }
}

/** Metadata only; used by persistence tests without object storage. */
export type AttachmentMetadata = Omit<Prisma.ChecksheetAttachmentUncheckedCreateInput, "objectKey"> & {
  objectKey: string;
};
