import { config } from "@/lib/config";
import { prisma } from "@/server/db/client";
import { verifyPassword } from "@/server/auth/password";
import {
  checkLoginRateLimitByIp,
  checkLoginRateLimitByUsername,
  computeLockoutUntil,
} from "@/server/auth/rate-limit";
import { createSession } from "@/server/auth/session";
import { writeAudit } from "@/server/audit/audit";

/**
 * Alur login (SPEC-0001 §6.1) — 8 langkah.
 * Semua kegagalan mengembalikan pesan generik agar tidak membocorkan
 * apakah username terdaftar.
 */

export type LoginErrorCode =
  | "RATE_LIMITED"
  | "LOCKED"
  | "INVALID_CREDENTIALS"
  | "INACTIVE";

export interface LoginSuccess {
  ok: true;
  token: string;
  sessionId: string;
  maxAgeSeconds: number;
  user: {
    id: string;
    username: string;
    fullName: string;
    email: string;
    roles: { role: string; plantId: string }[];
  };
}

export interface LoginFailure {
  ok: false;
  code: LoginErrorCode;
  retryAfterSeconds?: number;
  lockedUntil?: Date;
}

export type LoginResult = LoginSuccess | LoginFailure;

export interface LoginInput {
  username: string;
  password: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  request?: Request | null;
  now?: Date;
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const now = input.now ?? new Date();
  const username = input.username.trim();

  // (1) Rate limit per IP
  if (input.ipAddress) {
    const ipLimit = checkLoginRateLimitByIp(input.ipAddress, now);
    if (!ipLimit.allowed) {
      return {
        ok: false,
        code: "RATE_LIMITED",
        retryAfterSeconds: ipLimit.retryAfterSeconds,
      };
    }
  }

  // (1b) Rate limit per username
  const userLimit = checkLoginRateLimitByUsername(username, now);
  if (!userLimit.allowed) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      retryAfterSeconds: userLimit.retryAfterSeconds,
    };
  }

  // (2) Cari user
  const user = await prisma.user.findUnique({
    where: { username },
    include: { roles: true },
  });

  if (!user) {
    await writeAudit({
      action: "LOGIN_FAILED",
      entity: "User",
      summaryKey: "audit.login.failed",
      summaryParams: { username },
      metadata: { reason: "USER_NOT_FOUND" },
      request: input.request ?? null,
    });
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  // (3) Cek aktif & terkunci
  if (!user.isActive) {
    await writeAudit({
      action: "LOGIN_FAILED",
      entity: "User",
      entityId: user.id,
      summaryKey: "audit.login.failed",
      summaryParams: { username },
      metadata: { reason: "INACTIVE" },
      actor: { id: user.id, name: user.fullName },
      request: input.request ?? null,
    });
    return { ok: false, code: "INACTIVE" };
  }

  if (user.lockedUntil && user.lockedUntil > now) {
    await writeAudit({
      action: "LOGIN_FAILED",
      entity: "User",
      entityId: user.id,
      summaryKey: "audit.login.failed",
      summaryParams: { username },
      metadata: { reason: "LOCKED" },
      actor: { id: user.id, name: user.fullName },
      request: input.request ?? null,
    });
    return { ok: false, code: "LOCKED", lockedUntil: user.lockedUntil };
  }

  // (4) Verifikasi password
  const passwordOk = await verifyPassword(user.passwordHash, input.password);

  if (!passwordOk) {
    const failedAttempts = user.failedAttempts + 1;
    const lockedUntil = computeLockoutUntil(failedAttempts, now);

    await prisma.user.update({
      where: { id: user.id },
      data: { failedAttempts, lockedUntil },
    });

    await writeAudit({
      action: "LOGIN_FAILED",
      entity: "User",
      entityId: user.id,
      summaryKey: "audit.login.failed",
      summaryParams: { username },
      metadata: { reason: "WRONG_PASSWORD", failedAttempts, locked: lockedUntil !== null },
      actor: { id: user.id, name: user.fullName },
      request: input.request ?? null,
    });

    if (lockedUntil) {
      return { ok: false, code: "LOCKED", lockedUntil };
    }
    return { ok: false, code: "INVALID_CREDENTIALS" };
  }

  // (5) Sukses — reset counter
  await prisma.user.update({
    where: { id: user.id },
    data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: now },
  });

  // (6) Buat session
  const plantIds = Array.from(new Set(user.roles.map((r) => r.plantId)));
  const { token, sessionId } = await createSession({
    userId: user.id,
    plantId: plantIds.length === 1 ? (plantIds[0] ?? null) : null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    now,
  });

  // (7) Audit login sukses
  await writeAudit({
    action: "LOGIN_SUCCESS",
    entity: "User",
    entityId: user.id,
    summaryKey: "audit.login.success",
    summaryParams: { username: user.username },
    actor: { id: user.id, name: user.fullName },
    plantId: plantIds.length === 1 ? (plantIds[0] ?? null) : null,
    request: input.request ?? null,
  });

  return {
    ok: true,
    token,
    sessionId,
    maxAgeSeconds: config.session.absoluteHours * 3600,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      roles: user.roles.map((r) => ({ role: r.role, plantId: r.plantId })),
    },
  };
}
