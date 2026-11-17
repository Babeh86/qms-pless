import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { hash, type Options } from "@node-rs/argon2";

/**
 * Helper integrasi: menyiapkan database test yang bersih.
 * Membutuhkan PostgreSQL lokal dengan database `qms_test`.
 */

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://qms:qms_dev_password@localhost:5432/qms_test?schema=public";

/**
 * Aplikasi (`src/server/db/client.ts`) membuat PrismaClient dari `DATABASE_URL`.
 * Agar helper dan kode aplikasi memakai database yang SAMA, kita set env
 * sebelum modul aplikasi diimpor (setup file sudah berjalan lebih dulu).
 */
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("/qms?")) {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
}

export const prisma = new PrismaClient({
  datasources: { db: { url: TEST_DATABASE_URL } },
});

const ARGON2_OPTIONS: Options = {
  algorithm: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

export const TEST_PASSWORD = "TestRahasia2026";

/** Mengosongkan tabel transaksi & master (kecuali audit_logs yang append-only). */
export async function resetDatabase(): Promise<void> {
  // audit_logs dilindungi trigger; gunakan truncate dengan trigger dimatikan sementara.
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_logs_no_update') THEN
        ALTER TABLE audit_logs DISABLE TRIGGER audit_logs_no_update;
      END IF;
      IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_logs_no_truncate') THEN
        ALTER TABLE audit_logs DISABLE TRIGGER audit_logs_no_truncate;
      END IF;
    END $$;
  `);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE;`);
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE sessions, user_roles, users, plants CASCADE;`);
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      ALTER TABLE audit_logs ENABLE TRIGGER audit_logs_no_update;
      ALTER TABLE audit_logs ENABLE TRIGGER audit_logs_no_truncate;
    END $$;
  `);
}

export interface SeedResult {
  plantId: string;
  userId: string;
}

/** Membuat plant + satu user dengan peran tertentu. */
export async function seedUser(
  username: string,
  role: "ADMIN" | "MD_ADMIN" | "INSPECTOR" | "CHECKED" | "APPROVED" | "VIEWER" = "INSPECTOR",
): Promise<SeedResult> {
  const plant = await prisma.plant.upsert({
    where: { code: "TST" },
    update: {},
    create: { code: "TST", name: "TEST PLANT" },
  });

  const passwordHash = await hash(TEST_PASSWORD, ARGON2_OPTIONS);

  const user = await prisma.user.upsert({
    where: { username },
    update: { passwordHash, isActive: true, failedAttempts: 0, lockedUntil: null },
    create: {
      username,
      fullName: `Test ${username}`,
      email: `${username}@test.local`,
      passwordHash,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_role_plantId: { userId: user.id, role, plantId: plant.id },
    },
    update: {},
    create: { userId: user.id, role, plantId: plant.id },
  });

  return { plantId: plant.id, userId: user.id };
}

/** Menjalankan `prisma migrate deploy` terhadap DB test. */
export function migrateTestDatabase(): void {
  execSync("npx prisma migrate deploy", {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}
