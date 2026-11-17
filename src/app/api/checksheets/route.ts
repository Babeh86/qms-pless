import { NextResponse } from "next/server";
import { requirePermission } from "@/server/authz/guard";
import { createChecksheet, listChecksheets } from "@/server/checksheet/checksheet-service";
import { checksheetCreateSchema, checksheetListQuerySchema } from "@/lib/validation/checksheet";
import { errorResponse, handleApiError } from "@/lib/api-response";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const ctx = await requirePermission("checksheet.create");

    const url = new URL(request.url);
    const parsed = checksheetListQuerySchema.safeParse(
      Object.fromEntries(Array.from(url.searchParams.entries()).filter(([, value]) => value !== "")),
    );
    if (!parsed.success) {
      return errorResponse("VALIDATION", 422, {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      });
    }

    return NextResponse.json(await listChecksheets(ctx, parsed.data));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const ctx = await requirePermission("checksheet.create");

    const body: unknown = await request.json();
    const parsed = checksheetCreateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION", 422, {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      });
    }

    const record = await createChecksheet(ctx, parsed.data, { request });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
