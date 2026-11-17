import { NextResponse } from "next/server";
import { requirePermission } from "@/server/authz/guard";
import { listAttachments, uploadAttachment } from "@/server/checksheet/attachment-service";
import { ATTACHMENT_MAX_BYTES } from "@/server/storage/object-storage";
import { errorResponse, handleApiError } from "@/lib/api-response";

/** 30 MB payload plus multipart overhead. */
const MAX_REQUEST_BYTES = ATTACHMENT_MAX_BYTES + 1_000_000;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const ctx = await requirePermission("checksheet.create");
    const { id } = await context.params;
    return NextResponse.json({ items: await listAttachments(ctx, id) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const ctx = await requirePermission("checksheet.create");
    const { id } = await context.params;

    const declaredLength = Number(request.headers.get("content-length") ?? "0");
    if (declaredLength > MAX_REQUEST_BYTES) {
      return errorResponse("VALIDATION", 413, { reason: "PAYLOAD_TOO_LARGE" });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return errorResponse("VALIDATION", 422, { reason: "FILE_REQUIRED" });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const record = await uploadAttachment(
      ctx,
      id,
      { fileName: file.name, contentType: file.type || "application/octet-stream", bytes },
      { request },
    );

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
