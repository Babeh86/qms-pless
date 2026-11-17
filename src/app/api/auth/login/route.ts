import { NextResponse } from "next/server";
import { login } from "@/server/auth/login";
import { sessionCookieOptions } from "@/server/auth/session";
import { clientIp, errorResponse, handleApiError } from "@/lib/api-response";
import { loginSchema } from "@/lib/validation/auth";
import { config } from "@/lib/config";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("VALIDATION", 422, { reason: "INVALID_JSON" });
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION", 422, {
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      });
    }

    const result = await login({
      username: parsed.data.username,
      password: parsed.data.password,
      ipAddress: clientIp(request),
      userAgent: request.headers.get("user-agent"),
      request,
    });

    if (!result.ok) {
      switch (result.code) {
        case "RATE_LIMITED":
          return errorResponse(
            "RATE_LIMITED",
            429,
            { retryAfterSeconds: result.retryAfterSeconds },
            { "Retry-After": String(result.retryAfterSeconds ?? 60) },
          );
        case "LOCKED":
          return errorResponse("LOCKED", 423, {
            lockedUntil: result.lockedUntil?.toISOString() ?? null,
          });
        case "INACTIVE":
          return errorResponse("FORBIDDEN", 403, { reason: "INACTIVE" });
        case "INVALID_CREDENTIALS":
        default:
          return errorResponse("UNAUTHENTICATED", 401);
      }
    }

    const response = NextResponse.json({
      user: result.user,
      roles: result.user.roles,
    });

    const cookie = sessionCookieOptions(result.maxAgeSeconds);
    response.cookies.set({
      name: cookie.name,
      value: result.token,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      path: cookie.path,
      maxAge: cookie.maxAge,
    });

    // Pastikan tidak ada kebocoran informasi sensitif.
    void config;

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
