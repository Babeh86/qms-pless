import { NextResponse } from "next/server";
import { readSessionToken, revokeSession, hashSessionToken } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { writeAudit } from "@/server/audit/audit";
import { clientIp, handleApiError } from "@/lib/api-response";
import { config } from "@/lib/config";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const token = await readSessionToken();

    if (token) {
      const sessionId = hashSessionToken(token);

      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: { select: { id: true, fullName: true } } },
      });

      if (session && !session.revokedAt) {
        await revokeSession(sessionId);
        await writeAudit({
          action: "LOGOUT",
          entity: "User",
          entityId: session.userId,
          summaryKey: "audit.logout",
          actor: { id: session.user.id, name: session.user.fullName },
          request,
        });
      }
    }

    const response = new NextResponse(null, { status: 204 });
    response.cookies.set({
      name: config.session.cookieName,
      value: "",
      httpOnly: true,
      secure: config.isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    void clientIp;
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
