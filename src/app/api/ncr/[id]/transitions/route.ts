import { NextResponse } from "next/server";
import { requirePermission } from "@/server/authz/guard";
import { transitionNcr } from "@/server/ncr/ncr-service";
import { ncrTransitionSchema } from "@/lib/validation/checksheet";
import { errorResponse, handleApiError } from "@/lib/api-response";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const ctx = await requirePermission("ncr.manage");
    const { id } = await context.params;

    const body: unknown = await request.json();
    const parsed = ncrTransitionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION", 422, {
        issues: parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
      });
    }

    return NextResponse.json(await transitionNcr(ctx, id, parsed.data, { request }));
  } catch (error) {
    return handleApiError(error);
  }
}
