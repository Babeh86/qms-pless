import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma, resetDatabase } from "./helpers";

/**
 * T25 — Trigger append-only pada `audit_logs` (SPEC-0001 §3).
 * Jaminan auditabilitas di level database.
 */

beforeAll(async () => {
  await prisma.$connect();
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function insertAudit(): Promise<bigint> {
  const row = await prisma.auditLog.create({
    data: {
      action: "LOGIN_SUCCESS",
      entity: "Test",
      summaryKey: "audit.login.success",
      summaryParams: { username: "tester" },
    },
    select: { id: true },
  });
  return row.id;
}

describe("audit_logs append-only", () => {
  it("mengizinkan INSERT", async () => {
    const id = await insertAudit();
    expect(id).toBeGreaterThan(0n);
  });

  it("menolak UPDATE via raw SQL", async () => {
    const id = await insertAudit();

    await expect(
      prisma.$executeRawUnsafe(`UPDATE audit_logs SET entity = 'HACKED' WHERE id = $1`, id),
    ).rejects.toThrow(/append-only/i);
  });

  it("menolak DELETE via raw SQL", async () => {
    const id = await insertAudit();

    await expect(
      prisma.$executeRawUnsafe(`DELETE FROM audit_logs WHERE id = $1`, id),
    ).rejects.toThrow(/append-only/i);
  });

  it("menolak TRUNCATE", async () => {
    await insertAudit();

    await expect(prisma.$executeRawUnsafe(`TRUNCATE TABLE audit_logs`)).rejects.toThrow(
      /append-only/i,
    );
  });

  it("menolak UPDATE melalui Prisma Client", async () => {
    const id = await insertAudit();

    await expect(
      prisma.auditLog.update({ where: { id }, data: { entity: "HACKED" } }),
    ).rejects.toThrow();
  });

  it("menolak DELETE melalui Prisma Client", async () => {
    const id = await insertAudit();

    await expect(prisma.auditLog.delete({ where: { id } })).rejects.toThrow();
  });

  it("data lama tetap utuh setelah percobaan mutasi gagal", async () => {
    const id = await insertAudit();

    await expect(
      prisma.$executeRawUnsafe(`UPDATE audit_logs SET entity = 'HACKED' WHERE id = $1`, id),
    ).rejects.toThrow();

    const row = await prisma.auditLog.findUnique({ where: { id } });
    expect(row?.entity).toBe("Test");
  });
});
