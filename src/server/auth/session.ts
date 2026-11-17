import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { config } from "@/lib/config";
import { prisma } from "@/server/db/client";
import type { RoleCode } from "@prisma/client";

/**
 * Session berbasis DB (SPEC-0001 §6.3).
 *
 * - Token mentah (32 byte) disimpan di cookie HttpOnly.
 * - DB hanya menyimpan SHA-256(token) sebagai primary key.
 * - `expiresAt`      = batas idle (sliding, diperpanjang saat aktivitas)
 * - `absoluteEnds`   = batas absolut, tidak pernah diperpanjang
 */

export interface SessionContext {
  sessionId: string;
  userId: string;
  username: string;
  fullName: string;
  email: string;
  /** Semua peran milik user, lengkap dengan plant-nya. */
  roles: { role: RoleCode; plantId: string }[];
  /** Daftar plant yang dapat diakses. */
  plantIds: string[];
  /** Plant yang sedang aktif (bila hanya satu, otomatis terisi). */
  activePlantId: string | null;
}

const SESSION_TOKEN_BYTES = 32;

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(SESSION_TOKEN_BYTES).toString("base64url");
}

export interface CreateSessionInput {
  userId: string;
  plantId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  now?: Date;
}

/**
 * Membuat session baru dan mengembalikan token mentah.
 * Pemanggil bertanggung jawab menyetel cookie.
 */
export async function createSession(input: CreateSessionInput): Promise<{
  token: string;
  sessionId: string;
  expiresAt: Date;
  absoluteEnds: Date;
}> {
  const now = input.now ?? new Date();
  const token = generateSessionToken();
  const sessionId = hashSessionToken(token);

  const expiresAt = new Date(now.getTime() + config.session.idleMinutes * 60_000);
  const absoluteEnds = new Date(now.getTime() + config.session.absoluteHours * 3_600_000);

  await prisma.session.create({
    data: {
      id: sessionId,
      userId: input.userId,
      plantId: input.plantId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      expiresAt,
      absoluteEnds,
    },
  });

  return { token, sessionId, expiresAt, absoluteEnds };
}

/**
 * Memvalidasi token session dan mengembalikan konteks.
 * Memperpanjang `expiresAt` (sliding) tanpa melewati `absoluteEnds`.
 * Mengembalikan null bila tidak valid / kedaluwarsa / dicabut.
 */
export async function validateSession(
  token: string,
  now: Date = new Date(),
): Promise<SessionContext | null> {
  const sessionId = hashSessionToken(token);

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      user: {
        include: {
          roles: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.revokedAt) return null;
  if (!session.user.isActive) return null;
  if (session.user.lockedUntil && session.user.lockedUntil > now) return null;
  if (session.expiresAt <= now) return null;
  if (session.absoluteEnds <= now) return null;

  // Sliding expiry: perpanjang, tetapi tidak melewati batas absolut.
  const extended = new Date(now.getTime() + config.session.idleMinutes * 60_000);
  const nextExpiry = extended > session.absoluteEnds ? session.absoluteEnds : extended;

  if (nextExpiry.getTime() - session.expiresAt.getTime() > 30_000) {
    await prisma.session.update({
      where: { id: sessionId },
      data: { expiresAt: nextExpiry },
    });
  }

  const roles = session.user.roles.map((r) => ({ role: r.role, plantId: r.plantId }));
  const plantIds = Array.from(new Set(roles.map((r) => r.plantId)));

  return {
    sessionId,
    userId: session.user.id,
    username: session.user.username,
    fullName: session.user.fullName,
    email: session.user.email,
    roles,
    plantIds,
    activePlantId: session.plantId ?? (plantIds.length === 1 ? (plantIds[0] ?? null) : null),
  };
}

/** Mencabut satu session (logout). */
export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/**
 * Mencabut seluruh session milik user.
 * @param exceptSessionId opsional — session yang dikecualikan (mis. sesi saat ini)
 */
export async function revokeAllUserSessions(
  userId: string,
  exceptSessionId?: string,
): Promise<number> {
  const result = await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
    },
    data: { revokedAt: new Date() },
  });
  return result.count;
}

// ─────────────── Cookie helpers ───────────────

export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    name: config.session.cookieName,
    httpOnly: true,
    secure: config.isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** Membaca token dari cookie (server component / route handler). */
export async function readSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(config.session.cookieName)?.value ?? null;
}

/** Mengambil konteks session dari cookie; null bila tidak terautentikasi. */
export async function getSessionContext(): Promise<SessionContext | null> {
  const token = await readSessionToken();
  if (!token) return null;
  return validateSession(token);
}
