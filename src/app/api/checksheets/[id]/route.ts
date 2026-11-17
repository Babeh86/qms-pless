import { NextResponse } from "next/server";
import { getChecksheet, updateChecksheetDraft } from "@/server/checksheet/checksheet-service";
import { requirePermission } from "@/server/authz/guard";
import { checksheetUpdateSchema } from "@/lib/validation/checksheet";
import { errorResponse, handleApiError } from "@/lib/api-response";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const ctx = await requirePermission("checksheet.create");
    const { id } = await context.params;
    const record = await getChecksheet(ctx, id);
    if (!record) return errorResponse("NOT_FOUND", 404);
    return NextResponse.json(record);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const ctx = await requirePermission("checksheet.edit");
    const { id } = await context.params;

    const body: unknown = await request.json();
    const parsed = checksheetUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION", 422, {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      });
    }

    return NextResponse.json(await updateChecksheetDraft(ctx, id, parsed.data, { request }));
  } catch (error) {
    return handleApiError(error);
  }
}
