import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma, resetDatabase, seedUser } from "./helpers";
import type { SessionContext } from "@/server/auth/session";
import { getNotifications } from "@/server/notifications/notifications";

beforeAll(async () => {
  await prisma.$connect();
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase();
});

async function sessionFor(
  username: string,
  role: "INSPECTOR" | "CHECKED" | "APPROVED",
): Promise<SessionContext> {
  const { plantId, userId } = await seedUser(username, role);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return {
    sessionId: "test",
    userId,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    roles: [{ role, plantId }],
    plantIds: [plantId],
    activePlantId: plantId,
  };
}

async function checksheetWith(
  plantId: string,
  userId: string,
  status: "SUBMITTED" | "CHECKED" | "DRAFT",
) {
  return prisma.checksheet.create({
    data: {
      number: `CS/T/${Math.random().toString(36).slice(2, 8)}`,
      formCode: "CS-01",
      formName: "Incoming",
      templateRevision: "00",
      plantId,
      createdById: userId,
      partNoSnapshot: "P-1",
      partNameSnapshot: "PART",
      lotNoSnapshot: "LOT-1",
      inspectionDate: new Date("2026-11-17T00:00:00.000Z"),
      headerSnapshot: { lotNo: "LOT-1" },
      itemSnapshot: { "flat:0:0": "OK" },
      totalItems: 1,
      ngItems: 0,
      finalJudgment: "OK",
      status,
    },
  });
}

describe("notifications — integration", () => {
  it("checker melihat antrian SUBMITTED", async () => {
    const checker = await sessionFor("notif_checker", "CHECKED");
    await checksheetWith(checker.plantIds[0] as string, checker.userId, "SUBMITTED");

    const items = await getNotifications(checker);
    const approval = items.find((item) => item.id === "pending-approval");
    expect(approval?.count).toBe(1);
    expect(approval?.href).toBe("/approval");
  });

  it("approver melihat antrian CHECKED, bukan SUBMITTED", async () => {
    const approver = await sessionFor("notif_approver", "APPROVED");
    const plantId = approver.plantIds[0] as string;
    await checksheetWith(plantId, approver.userId, "SUBMITTED");
    await checksheetWith(plantId, approver.userId, "CHECKED");

    const approval = (await getNotifications(approver)).find(
      (item) => item.id === "pending-approval",
    );
    expect(approval?.count).toBe(1);
  });

  it("inspector tanpa wewenang approval tidak menerima notifikasi approval", async () => {
    const inspector = await sessionFor("notif_inspector", "INSPECTOR");
    await checksheetWith(inspector.plantIds[0] as string, inspector.userId, "SUBMITTED");

    const items = await getNotifications(inspector);
    expect(items.some((item) => item.id === "pending-approval")).toBe(false);
  });

  it("NCR terbuka dan melewati target muncul sebagai notifikasi", async () => {
    const inspector = await sessionFor("notif_ncr", "INSPECTOR");
    const plantId = inspector.plantIds[0] as string;

    await prisma.ncr.create({
      data: {
        number: "NCR/T/0001",
        plantId,
        createdById: inspector.userId,
        partNo: "P-1",
        partName: "PART",
        lotNo: "LOT-1",
        defectType: "Burr",
        severity: "MAJOR",
        description: "Burr melebihi standar",
        targetDate: new Date("2020-01-01T00:00:00.000Z"),
        status: "OPEN",
      },
    });

    const items = await getNotifications(inspector);
    expect(items.find((item) => item.id === "ncr-overdue")?.count).toBe(1);
    expect(items.find((item) => item.id === "ncr-open")?.count).toBe(1);
  });

  it("tidak mengirim notifikasi untuk plant lain", async () => {
    const checker = await sessionFor("notif_plant", "CHECKED");
    const otherPlant = await prisma.plant.create({ data: { code: "OTH2", name: "OTHER" } });
    await checksheetWith(otherPlant.id, checker.userId, "SUBMITTED");

    const items = await getNotifications(checker);
    expect(items.some((item) => item.id === "pending-approval")).toBe(false);
  });
});
