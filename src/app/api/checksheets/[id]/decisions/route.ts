import { NextResponse } from "next/server";
import { requireSession } from "@/server/authz/guard";
import { listDecisions, transitionChecksheet } from "@/server/checksheet/workflow-service";
import { checksheetTransitionSchema } from "@/lib/validation/checksheet";
import { errorResponse, handleApiError } from "@/lib/api-response";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const ctx = await requireSession();
    const { id } = await context.params;
    return NextResponse.json({ items: await listDecisions(ctx, id) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const ctx = await requireSession();
    const { id } = await context.params;

    const body: unknown = await request.json();
    const parsed = checksheetTransitionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION", 422, {
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
        })),
      });
    }

    const result = await transitionChecksheet(
      ctx,
      id,
      parsed.data.action,
      parsed.data.comment,
      { request },
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
