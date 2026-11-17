import { NextResponse } from "next/server";
import { requireSession } from "@/server/authz/guard";
import { handleApiError } from "@/lib/api-response";

export async function GET(): Promise<NextResponse> {
  try {
    const ctx = await requireSession();

    return NextResponse.json({
      user: {
        id: ctx.userId,
        username: ctx.username,
        fullName: ctx.fullName,
        email: ctx.email,
      },
      roles: ctx.roles,
      plantIds: ctx.plantIds,
      activePlantId: ctx.activePlantId,
      permissions: Array.from(ctx.permissions).sort(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
