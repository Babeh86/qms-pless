import { NextResponse } from "next/server";
import { AppError } from "@/server/authz/guard";

/**
 * Konvensi respons error seragam (SPEC-0001 §5).
 */

export interface ApiErrorBody {
  error: {
    code: string;
    messageKey: string;
    details?: Record<string, unknown>;
  };
}

const CODE_TO_MESSAGE_KEY: Record<string, string> = {
  UNAUTHENTICATED: "error.unauthenticated",
  FORBIDDEN: "error.forbidden",
  NOT_FOUND: "error.notFound",
  VALIDATION: "error.validation",
  RATE_LIMITED: "error.rateLimited",
  LOCKED: "error.locked",
  INTERNAL: "error.internal",
};

export function errorResponse(
  code: string,
  status: number,
  details?: Record<string, unknown>,
  headers?: Record<string, string>,
): NextResponse<ApiErrorBody> {
  return NextResponse.json<ApiErrorBody>(
    {
      error: {
        code,
        messageKey: CODE_TO_MESSAGE_KEY[code] ?? "error.internal",
        ...(details ? { details } : {}),
      },
    },
    { status, ...(headers ? { headers } : {}) },
  );
}

/** Menangani error yang dilempar handler dan memetakannya ke respons yang tepat. */
export function handleApiError(error: unknown): NextResponse<ApiErrorBody> {
  if (error instanceof AppError) {
    return errorResponse(error.code, error.status, error.details);
  }

  console.error("[api] unhandled error", error);
  return errorResponse("INTERNAL", 500);
}

/** Ekstraksi IP klien dari header proxy. */
export function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}
