import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma, resetDatabase, seedUser } from "./helpers";
import { permissionsOf } from "@/server/authz/permissions";
import type { AuthzContext } from "@/server/authz/guard";
import { createChecksheet } from "@/server/checksheet/checksheet-service";
import { createNcr, getNcr, listNcrEvents, listNcrs, transitionNcr } from "@/server/ncr/ncr-service";
import type { ChecksheetCreateInput, NcrCreateInput } from "@/lib/validation/checksheet";

beforeAll(async () => {
  await prisma.$connect();
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase();
});

async function contextFor(
  username: string,
  role: "INSPECTOR" | "CHECKED" | "APPROVED" | "VIEWER",
): Promise<AuthzContext> {
  const { plantId, userId } = await seedUser(username, role);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const roles = [{ role, plantId }];
  return {
    sessionId: "test",
    userId,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    roles,
    plantIds: [plantId],
    activePlantId: plantId,
    permissions: permissionsOf({ roles }),
  };
}

function checksheetPayload(itemValue: string): ChecksheetCreateInput {
  return {
    formCode: "CS-01",
    formName: "Incoming Material COLLAR",
    templateRevision: "2025-01",
    partNo: "7145-0040-0w",
    partName: "COLLAR",
    lotNo: "LOT-NCR-001",
    inspectionDate: "2026-11-17",
    headerSnapshot: { partNo: "7145-0040-0w", lotNo: "LOT-NCR-001" },
    itemSnapshot: { "flat:0:0": itemValue },
    totalItems: 1,
    ngItems: itemValue === "NG" ? 1 : 0,
    finalJudgment: itemValue === "NG" ? "NG" : "OK",
  };
}

function ncrPayload(overrides: Partial<NcrCreateInput> = {}): NcrCreateInput {
  return {
    partNo: "7145-0040-0w",
    partName: "COLLAR",
    lotNo: "LOT-NCR-001",
    defectType: "Burr",
    severity: "MAJOR",
    description: "Burr pada parting line melebihi standar",
    ...overrides,
  };
}

describe("NCR / CAPA — integration", () => {
  it("membuat NCR dari item inspeksi berstatus NG dan menautkannya", async () => {
    const inspector = await contextFor("ncr_inspector", "INSPECTOR");
    const doc = await createChecksheet(inspector, checksheetPayload("NG"));

    const ncr = await createNcr(
      inspector,
      ncrPayload({ checksheetId: doc.id, checksheetItemKey: "flat:0:0" }),
    );

    expect(ncr.number).toMatch(/^NCR\/\d{4}\/TST\/\d{4}$/);
    expect(ncr.checksheetId).toBe(doc.id);
    expect(ncr.checksheetItemKey).toBe("flat:0:0");
    expect(ncr.status).toBe("OPEN");
  });

  it("menolak membuat NCR dari item yang OK atau key yang tidak ada", async () => {
    const inspector = await contextFor("ncr_bad_source", "INSPECTOR");
    const doc = await createChecksheet(inspector, checksheetPayload("OK"));

    await expect(
      createNcr(inspector, ncrPayload({ checksheetId: doc.id, checksheetItemKey: "flat:0:0" })),
    ).rejects.toThrow(/NG/);

    await expect(
      createNcr(inspector, ncrPayload({ checksheetId: doc.id, checksheetItemKey: "flat:9:9" })),
    ).rejects.toThrow(/tidak ada/);
  });

  it("menjalankan lifecycle CONTAIN → PLAN_ACTION → VERIFY → CLOSE", async () => {
    const inspector = await contextFor("ncr_life_inspector", "INSPECTOR");
    const supervisor = await contextFor("ncr_life_supervisor", "CHECKED");
    const doc = await createChecksheet(inspector, checksheetPayload("NG"));
    const ncr = await createNcr(
      inspector,
      ncrPayload({ checksheetId: doc.id, checksheetItemKey: "flat:0:0" }),
    );

    expect((await transitionNcr(supervisor, ncr.id, { action: "CONTAIN", containment: "Sortir 100%", note: "Kontain" })).status).toBe("CONTAINED");

    expect(
      (
        await transitionNcr(supervisor, ncr.id, {
          action: "PLAN_ACTION",
          rootCause: "Suhu mold tidak stabil",
          correctiveAction: "Kalibrasi mold temperature controller",
          preventiveAction: "Cek harian suhu mold",
          note: "Rencana CAPA disusun",
        })
      ).status,
    ).toBe("IN_ACTION");

    expect(
      (await transitionNcr(supervisor, ncr.id, { action: "VERIFY", verification: "Uji ulang 30 pcs OK", note: "Verifikasi" })).status,
    ).toBe("VERIFIED");

    const closed = await transitionNcr(supervisor, ncr.id, { action: "CLOSE" });
    expect(closed.status).toBe("CLOSED");
    expect(closed.closedAt).not.toBeNull();

    const events = await listNcrEvents(inspector, ncr.id);
    expect(events.map((event) => event.action)).toEqual([
      "CREATE",
      "CONTAIN",
      "PLAN_ACTION",
      "VERIFY",
      "CLOSE",
    ]);
  });

  it("menolak transisi yang melewati tahapan atau tanpa field wajib", async () => {
    const inspector = await contextFor("ncr_skip_inspector", "INSPECTOR");
    const supervisor = await contextFor("ncr_skip_supervisor", "CHECKED");
    const ncr = await createNcr(inspector, ncrPayload());

    await expect(transitionNcr(supervisor, ncr.id, { action: "CLOSE" })).rejects.toThrow(
      /tidak diizinkan/,
    );

    expect((await transitionNcr(supervisor, ncr.id, { action: "CONTAIN", containment: "Sortir", note: "ok" })).status).toBe("CONTAINED");
    await expect(
      transitionNcr(supervisor, ncr.id, { action: "PLAN_ACTION", note: "tanpa isi" }),
    ).rejects.toThrow(/rootCause/);
  });

  it("menolak peran tanpa izin mengelola NCR", async () => {
    const inspector = await contextFor("ncr_perm_inspector", "INSPECTOR");
    const ncr = await createNcr(inspector, ncrPayload());

    await expect(
      transitionNcr(inspector, ncr.id, { action: "CONTAIN", containment: "x", note: "x" }),
    ).rejects.toThrow();
  });

  it("menolak NCR dari plant lain", async () => {
    const inspector = await contextFor("ncr_plant_a", "INSPECTOR");
    const ncr = await createNcr(inspector, ncrPayload());

    // Different plant: same role and permissions, but no access to this plant.
    const otherPlant = await prisma.plant.create({
      data: { code: "OTH", name: "OTHER PLANT" },
    });
    const other = await contextFor("ncr_plant_b", "CHECKED");
    const crossPlantCtx: AuthzContext = {
      ...other,
      plantIds: [otherPlant.id],
      activePlantId: otherPlant.id,
    };

    await expect(getNcr(crossPlantCtx, ncr.id)).rejects.toThrow(/plant lain/);
  });

  it("mencegah dua transisi konkuren pada status yang sama", async () => {
    const inspector = await contextFor("ncr_race_inspector", "INSPECTOR");
    const a = await contextFor("ncr_race_a", "CHECKED");
    const b = await contextFor("ncr_race_b", "CHECKED");
    const ncr = await createNcr(inspector, ncrPayload());

    const results = await Promise.allSettled([
      transitionNcr(a, ncr.id, { action: "CONTAIN", containment: "A", note: "A" }),
      transitionNcr(b, ncr.id, { action: "CONTAIN", containment: "B", note: "B" }),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
  });

  it("menandai NCR melewati target dan memfilter daftar berdasarkan status", async () => {
    const inspector = await contextFor("ncr_list_inspector", "INSPECTOR");
    await createNcr(inspector, ncrPayload({ targetDate: "2020-01-01" }));
    await createNcr(inspector, ncrPayload({ defectType: "Short shot", targetDate: "2099-01-01" }));

    const list = await listNcrs(inspector, { page: 1, pageSize: 50, status: "OPEN" });
    expect(list.total).toBe(2);
    expect(list.items.some((item) => item.overdue)).toBe(true);
  });

  it("mencatat audit pembuatan dan transisi NCR", async () => {
    const inspector = await contextFor("ncr_audit_inspector", "INSPECTOR");
    const supervisor = await contextFor("ncr_audit_supervisor", "CHECKED");
    const ncr = await createNcr(inspector, ncrPayload());
    await transitionNcr(supervisor, ncr.id, { action: "CONTAIN", containment: "Sortir", note: "ok" });

    const audits = await prisma.auditLog.findMany({
      where: { entity: "Ncr", entityId: ncr.id },
      select: { action: true },
    });
    expect(audits.length).toBeGreaterThanOrEqual(2);
  });
});
