import { NextResponse } from "next/server";
import { requirePermission } from "@/server/authz/guard";
import { getAttachmentDownloadUrl } from "@/server/checksheet/attachment-service";
import { handleApiError } from "@/lib/api-response";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; attachmentId: string }> },
): Promise<NextResponse> {
  try {
    const ctx = await requirePermission("checksheet.create");
    const { id, attachmentId } = await context.params;
    return NextResponse.json(await getAttachmentDownloadUrl(ctx, id, attachmentId));
  } catch (error) {
    return handleApiError(error);
  }
}
