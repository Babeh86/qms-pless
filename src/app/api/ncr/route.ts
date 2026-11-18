import { NextResponse } from "next/server";
import { requirePermission } from "@/server/authz/guard";
import { createNcr, listNcrs } from "@/server/ncr/ncr-service";
import { ncrCreateSchema, ncrListQuerySchema } from "@/lib/validation/checksheet";
import { errorResponse, handleApiError } from "@/lib/api-response";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const ctx = await requirePermission("ncr.read");
    const url = new URL(request.url);
    const parsed = ncrListQuerySchema.safeParse(
      Object.fromEntries(Array.from(url.searchParams.entries()).filter(([, value]) => value !== "")),
    );
    if (!parsed.success) {
      return errorResponse("VALIDATION", 422, {
        issues: parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
      });
    }
    return NextResponse.json(await listNcrs(ctx, parsed.data));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ctx = await requirePermission("ncr.create");
    const body: unknown = await request.json();
    const parsed = ncrCreateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION", 422, {
        issues: parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
      });
    }
    return NextResponse.json(await createNcr(ctx, parsed.data, { request }), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
