import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  prisma,
  resetDatabase,
  seedUser,
  TEST_PASSWORD,
} from "./helpers";
import { login } from "@/server/auth/login";
import {
  hashSessionToken,
  revokeSession,
  validateSession,
} from "@/server/auth/session";
import { __resetRateLimitForTests } from "@/server/auth/rate-limit";

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  __resetRateLimitForTests();
  await resetDatabase();
});

describe("login() — integration", () => {
  it("berhasil dengan kredensial valid dan membuat session", async () => {
    const { userId } = await seedUser("inspector_a", "INSPECTOR");

    const result = await login({
      username: "inspector_a",
      password: TEST_PASSWORD,
      ipAddress: "10.1.1.1",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.token).toBeTruthy();
    expect(result.user.id).toBe(userId);
    expect(result.user.roles).toHaveLength(1);

    const session = await prisma.session.findUnique({
      where: { id: hashSessionToken(result.token) },
    });
    expect(session).not.toBeNull();
    expect(session?.revokedAt).toBeNull();

    // Audit LOGIN_SUCCESS tercatat
    const audit = await prisma.auditLog.findFirst({
      where: { action: "LOGIN_SUCCESS", entityId: userId },
    });
    expect(audit).not.toBeNull();
  });

  it("gagal dengan password salah dan mencatat LOGIN_FAILED", async () => {
    await seedUser("inspector_b", "INSPECTOR");

    const result = await login({
      username: "inspector_b",
      password: "passwordSalah2026",
      ipAddress: "10.1.1.2",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("INVALID_CREDENTIALS");

    const user = await prisma.user.findUnique({ where: { username: "inspector_b" } });
    expect(user?.failedAttempts).toBe(1);

    const audit = await prisma.auditLog.findFirst({
      where: { action: "LOGIN_FAILED" },
    });
    expect(audit).not.toBeNull();
  });

  it("gagal untuk username yang tidak ada (tanpa membocorkan info)", async () => {
    const result = await login({
      username: "tidak_ada",
      password: "apaSaja2026",
      ipAddress: "10.1.1.3",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("INVALID_CREDENTIALS");
  });

  it("mengunci akun setelah melewati batas percobaan gagal", async () => {
    await seedUser("inspector_c", "INSPECTOR");

    for (let i = 0; i < 5; i += 1) {
      await login({
        username: "inspector_c",
        password: "salahTerus2026",
        ipAddress: `10.1.2.${i}`,
      });
    }

    const result = await login({
      username: "inspector_c",
      password: TEST_PASSWORD,
      ipAddress: "10.1.3.1",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("LOCKED");
  });

  it("menolak user non-aktif", async () => {
    await seedUser("inspector_d", "INSPECTOR");
    await prisma.user.update({
      where: { username: "inspector_d" },
      data: { isActive: false },
    });

    const result = await login({
      username: "inspector_d",
      password: TEST_PASSWORD,
      ipAddress: "10.1.4.1",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("INACTIVE");
  });

  it("menerapkan rate limit per IP", async () => {
    await seedUser("inspector_e", "INSPECTOR");
    const ip = "10.9.9.9";

    const results = [];
    for (let i = 0; i < 6; i += 1) {
      results.push(
        await login({ username: "inspector_e", password: TEST_PASSWORD, ipAddress: ip }),
      );
    }

    const last = results[results.length - 1];
    expect(last?.ok).toBe(false);
    if (last && !last.ok) expect(last.code).toBe("RATE_LIMITED");
  });
});

describe("validateSession() / revokeSession()", () => {
  it("memvalidasi token dan mengembalikan konteks lengkap", async () => {
    const { userId, plantId } = await seedUser("inspector_f", "INSPECTOR");

    const result = await login({
      username: "inspector_f",
      password: TEST_PASSWORD,
      ipAddress: "10.2.0.1",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const ctx = await validateSession(result.token);
    expect(ctx).not.toBeNull();
    expect(ctx?.userId).toBe(userId);
    expect(ctx?.plantIds).toEqual([plantId]);
    expect(ctx?.roles[0]?.role).toBe("INSPECTOR");
  });

  it("mengembalikan null untuk token tidak dikenal", async () => {
    expect(await validateSession("token-palsu")).toBeNull();
  });

  it("mengembalikan null setelah session dicabut", async () => {
    await seedUser("inspector_g", "INSPECTOR");
    const result = await login({
      username: "inspector_g",
      password: TEST_PASSWORD,
      ipAddress: "10.2.0.2",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    await revokeSession(hashSessionToken(result.token));
    expect(await validateSession(result.token)).toBeNull();
  });

  it("mengembalikan null untuk session kedaluwarsa", async () => {
    await seedUser("inspector_h", "INSPECTOR");
    const result = await login({
      username: "inspector_h",
      password: TEST_PASSWORD,
      ipAddress: "10.2.0.3",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const sessionId = hashSessionToken(result.token);
    await prisma.session.update({
      where: { id: sessionId },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });

    expect(await validateSession(result.token)).toBeNull();
  });
});
