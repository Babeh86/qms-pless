import { PrismaClient, RoleCode } from "@prisma/client";
import { hash, type Options } from "@node-rs/argon2";

/**
 * Seed idempotent — aman dijalankan berulang.
 * SPEC-0001 §9
 */

const prisma = new PrismaClient();

const ARGON2_OPTIONS: Options = {
  algorithm: 2, // Argon2id
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

interface SeedUser {
  username: string;
  fullName: string;
  email: string;
  roles: RoleCode[];
}

const SEED_USERS: SeedUser[] = [
  {
    username: "admin",
    fullName: "System Administrator",
    email: "admin@plasess.local",
    roles: [RoleCode.ADMIN],
  },
  {
    username: "mdadmin",
    fullName: "Master Data Admin",
    email: "mdadmin@plasess.local",
    roles: [RoleCode.MD_ADMIN],
  },
  {
    username: "inspector1",
    fullName: "QC Inspector 1",
    email: "inspector1@plasess.local",
    roles: [RoleCode.INSPECTOR],
  },
  {
    username: "checked1",
    fullName: "QC Supervisor 1",
    email: "checked1@plasess.local",
    roles: [RoleCode.CHECKED],
  },
  {
    username: "approved1",
    fullName: "QC Manager 1",
    email: "approved1@plasess.local",
    roles: [RoleCode.APPROVED],
  },
  {
    username: "viewer1",
    fullName: "Auditor 1",
    email: "viewer1@plasess.local",
    roles: [RoleCode.VIEWER],
  },
];

async function main(): Promise<void> {
  const seedPassword = process.env.SEED_PASSWORD ?? "Qms#2026Dev";

  if (process.env.NODE_ENV === "production" && seedPassword === "Qms#2026Dev") {
    throw new Error("SEED_PASSWORD default tidak boleh dipakai di production");
  }

  // ── Plant ──
  const plant = await prisma.plant.upsert({
    where: { code: "KRW" },
    update: { name: "KARAWANG" },
    create: {
      code: "KRW",
      name: "KARAWANG",
      address: "Karawang, Jawa Barat, Indonesia",
      timezone: "Asia/Jakarta",
    },
  });
  console.log(`[seed] plant: ${plant.code} (${plant.name})`);

  // ── Users ──
  const passwordHash = await hash(seedPassword, ARGON2_OPTIONS);

  for (const seedUser of SEED_USERS) {
    const user = await prisma.user.upsert({
      where: { username: seedUser.username },
      update: { fullName: seedUser.fullName, email: seedUser.email, isActive: true },
      create: {
        username: seedUser.username,
        fullName: seedUser.fullName,
        email: seedUser.email,
        passwordHash,
        isActive: true,
      },
    });

    for (const role of seedUser.roles) {
      await prisma.userRole.upsert({
        where: {
          userId_role_plantId: { userId: user.id, role, plantId: plant.id },
        },
        update: {},
        create: { userId: user.id, role, plantId: plant.id },
      });
    }

    console.log(`[seed] user: ${user.username} → ${seedUser.roles.join(", ")}`);
  }

  console.log("[seed] selesai");
}

main()
  .catch((error: unknown) => {
    console.error("[seed] gagal:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });


