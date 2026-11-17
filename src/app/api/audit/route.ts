import { NextResponse } from "next/server";
import type { AuditAction } from "@prisma/client";
import { requirePermission } from "@/server/authz/guard";
import { listAudit } from "@/server/audit/audit";
import { auditQuerySchema } from "@/lib/validation/auth";
import { errorResponse, handleApiError } from "@/lib/api-response";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requirePermission("audit.read");

    const url = new URL(request.url);
    const raw = Object.fromEntries(
      Array.from(url.searchParams.entries()).filter(([, v]) => v !== ""),
    );

    const parsed = auditQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse("VALIDATION", 422, {
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      });
    }

    const { from, to, actorId, entity, action, page, pageSize } = parsed.data;

    const result = await listAudit({
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(actorId ? { actorId } : {}),
      ...(entity ? { entity } : {}),
      ...(action ? { action: action as AuditAction } : {}),
      ...(page ? { page } : {}),
      ...(pageSize ? { pageSize } : {}),
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
