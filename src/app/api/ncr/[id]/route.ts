import { NextResponse } from "next/server";
import { requirePermission } from "@/server/authz/guard";
import { getNcr, listNcrEvents } from "@/server/ncr/ncr-service";
import { handleApiError } from "@/lib/api-response";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const ctx = await requirePermission("ncr.read");
    const { id } = await context.params;

    if (new URL(request.url).searchParams.get("include") === "events") {
      return NextResponse.json({
        ncr: await getNcr(ctx, id),
        events: await listNcrEvents(ctx, id),
      });
    }

    return NextResponse.json(await getNcr(ctx, id));
  } catch (error) {
    return handleApiError(error);
  }
}
