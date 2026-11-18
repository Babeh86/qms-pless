import { NextResponse } from "next/server";
import { requirePermission } from "@/server/authz/guard";
import { prisma } from "@/server/db/client";
import { getSignedAttachmentUrl, readLocalAttachment } from "@/server/storage/object-storage";
import { errorResponse, handleApiError } from "@/lib/api-response";

/**
 * Streams a locally stored attachment. Only used by the development/local driver;
 * S3 deployments hand out short-lived signed URLs instead.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; attachmentId: string }> },
): Promise<NextResponse> {
  try {
    const ctx = await requirePermission("checksheet.create");
    const { id, attachmentId } = await context.params;

    const checksheet = await prisma.checksheet.findUnique({
      where: { id },
      select: { plantId: true, createdById: true },
    });
    if (!checksheet) return errorResponse("NOT_FOUND", 404);

    const canViewAll = ctx.permissions.has("checksheet.view.all");
    if (
      !ctx.plantIds.includes(checksheet.plantId) ||
      (!canViewAll && checksheet.createdById !== ctx.userId)
    ) {
      return errorResponse("FORBIDDEN", 403);
    }

    const attachment = await prisma.checksheetAttachment.findFirst({
      where: { id: attachmentId, checksheetId: id },
    });
    if (!attachment) return errorResponse("NOT_FOUND", 404);

    // S3 deployments redirect to a short-lived signed URL; local dev streams.
    const signed = await getSignedAttachmentUrl(attachment.objectKey);
    if (signed) {
      return NextResponse.redirect(signed, 302);
    }

    const bytes = await readLocalAttachment(attachment.objectKey);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": attachment.contentType,
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`,
        "Cache-Control": "private, max-age=60",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
