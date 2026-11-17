import type { RoleCode } from "@prisma/client";
import { getSessionContext, type SessionContext } from "@/server/auth/session";
import { permissionsOf, type Permission } from "@/server/authz/permissions";

/**
 * Guard otorisasi terpusat (SPEC-0001 §4.2).
 * WAJIB dipakai di setiap route handler & server action.
 */

export class AppError extends Error {
  constructor(
    public readonly code:
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "VALIDATION"
      | "RATE_LIMITED"
      | "LOCKED"
      | "INTERNAL",
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = "Sesi tidak valid, silakan login") {
    super("UNAUTHENTICATED", message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Anda tidak memiliki izin untuk aksi ini") {
    super("FORBIDDEN", message, 403);
  }
}

export interface CheckOptions {
  /** Plant tempat aksi dilakukan. Bila diisi, user harus punya akses ke plant tsb. */
  plantId?: string;
  /** Pemilik resource. Bila diisi, dicek untuk permission ber-scope owner. */
  ownerId?: string;
  /** Role yang wajib dimiliki (minimal salah satu). */
  requiredRoles?: RoleCode[];
}

export interface AuthzContext extends SessionContext {
  permissions: Set<Permission>;
}

/**
 * Menentukan apakah principal boleh melakukan `action`.
 * Aturan:
 *  - Permission harus dimiliki user (gabungan semua role).
 *  - Bila `plantId` diberikan, user harus memiliki akses plant tersebut.
 *  - Bila `requiredRoles` diberikan, user harus memiliki salah satunya.
 *  - `ownerId` hanya diperiksa oleh pemanggil (tidak otomatis menolak), karena
 *    ADMIN juga boleh mengedit milik orang lain. Gunakan `assertOwnership`.
 */
export function can(
  ctx: AuthzContext,
  action: Permission,
  options: CheckOptions = {},
): boolean {
  if (!ctx.permissions.has(action)) return false;

  if (options.plantId && !ctx.plantIds.includes(options.plantId)) return false;

  if (options.requiredRoles && options.requiredRoles.length > 0) {
    const owned = new Set<RoleCode>(ctx.roles.map((r) => r.role));
    if (!options.requiredRoles.some((r) => owned.has(r))) return false;
  }

  return true;
}

/** Menolak bila `can()` false. */
export function assertCan(
  ctx: AuthzContext,
  action: Permission,
  options: CheckOptions = {},
): void {
  if (!can(ctx, action, options)) {
    throw new ForbiddenError();
  }
}

/**
 * Menjamin resource hanya boleh diubah pemiliknya, kecuali user berperan ADMIN.
 */
export function assertOwnership(
  ctx: AuthzContext,
  ownerId: string,
  action: Permission,
): void {
  const isAdmin = ctx.roles.some((r) => r.role === "ADMIN");
  if (isAdmin) return;
  if (ownerId !== ctx.userId) {
    throw new ForbiddenError(`Anda hanya boleh melakukan ${action} pada data milik sendiri`);
  }
}

/**
 * Mengambil konteks session + permission.
 * @throws UnauthenticatedError bila belum login
 */
export async function requireSession(): Promise<AuthzContext> {
  const session = await getSessionContext();
  if (!session) throw new UnauthenticatedError();

  return { ...session, permissions: permissionsOf(session) };
}

/**
 * Seperti `requireSession`, tetapi sekaligus memeriksa permission.
 * @throws UnauthenticatedError | ForbiddenError
 */
export async function requirePermission(
  action: Permission,
  options: CheckOptions = {},
): Promise<AuthzContext> {
  const ctx = await requireSession();
  assertCan(ctx, action, options);
  return ctx;
}
