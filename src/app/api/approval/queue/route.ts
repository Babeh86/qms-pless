import { NextResponse } from "next/server";
import { requirePermission } from "@/server/authz/guard";
import { listApprovalQueue } from "@/server/checksheet/workflow-service";
import { handleApiError } from "@/lib/api-response";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") === "CHECKED" ? "CHECKED" : "SUBMITTED";
    const permission = status === "SUBMITTED" ? "checksheet.check" : "checksheet.approve";
    const ctx = await requirePermission(permission);

    const rows = await listApprovalQueue(ctx, status);
    return NextResponse.json({
      items: rows.map((row) => ({
        id: row.id,
        number: row.number,
        formCode: row.formCode,
        formName: row.formName,
        partNo: row.partNoSnapshot,
        partName: row.partNameSnapshot,
        lotNo: row.lotNoSnapshot,
        status: row.status,
        ngItems: row.ngItems,
        submittedAt: row.submittedAt?.toISOString() ?? null,
      })),
      total: rows.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
