import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma, resetDatabase, seedUser } from "./helpers";
import { permissionsOf } from "@/server/authz/permissions";
import type { AuthzContext } from "@/server/authz/guard";
import { createChecksheet } from "@/server/checksheet/checksheet-service";
import { listDecisions, transitionChecksheet } from "@/server/checksheet/workflow-service";
import type { ChecksheetCreateInput } from "@/lib/validation/checksheet";

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
  role: "INSPECTOR" | "CHECKED" | "APPROVED",
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

function payload(overrides: Partial<ChecksheetCreateInput> = {}): ChecksheetCreateInput {
  return {
    formCode: "CS-01",
    formName: "Incoming Material COLLAR",
    templateRevision: "2025-01",
    partNo: "7145-0040-0w",
    partName: "COLLAR",
    lotNo: "LOT-WF-001",
    inspectionDate: "2026-11-17",
    headerSnapshot: { partNo: "7145-0040-0w", lotNo: "LOT-WF-001" },
    itemSnapshot: { "flat:0:0": "OK" },
    totalItems: 1,
    ngItems: 0,
    finalJudgment: "OK",
    ...overrides,
  };
}

describe("check sheet approval workflow — integration", () => {
  it("menjalankan alur submit → check → approve dengan riwayat lengkap", async () => {
    const inspector = await contextFor("wf_inspector", "INSPECTOR");
    const checker = await contextFor("wf_checker", "CHECKED");
    const approver = await contextFor("wf_approver", "APPROVED");
    const doc = await createChecksheet(inspector, payload());

    expect((await transitionChecksheet(inspector, doc.id, "SUBMIT", undefined)).status).toBe(
      "SUBMITTED",
    );
    expect((await transitionChecksheet(checker, doc.id, "CHECK", "Hasil sesuai")).status).toBe(
      "CHECKED",
    );
    expect((await transitionChecksheet(approver, doc.id, "APPROVE", "Disetujui")).status).toBe(
      "APPROVED",
    );

    const history = await listDecisions(inspector, doc.id);
    expect(history.map((d) => d.action)).toEqual(["SUBMIT", "CHECK", "APPROVE"]);
    expect(history.map((d) => d.actorRole)).toEqual(["INSPECTOR", "CHECKED", "APPROVED"]);

    const stored = await prisma.checksheet.findUniqueOrThrow({ where: { id: doc.id } });
    expect(stored.checkedById).toBe(checker.userId);
    expect(stored.approvedById).toBe(approver.userId);
    expect(stored.approvedAt).not.toBeNull();
  });

  it("menolak inspector melakukan check atau approve", async () => {
    const inspector = await contextFor("wf_bad_inspector", "INSPECTOR");
    const doc = await createChecksheet(inspector, payload());
    await transitionChecksheet(inspector, doc.id, "SUBMIT", undefined);

    await expect(transitionChecksheet(inspector, doc.id, "CHECK", "x")).rejects.toThrow(
      /tidak diizinkan/,
    );
  });

  it("menolak checker melakukan approve sebelum check", async () => {
    const inspector = await contextFor("wf_c_inspector", "INSPECTOR");
    const checker = await contextFor("wf_c_checker", "CHECKED");
    const doc = await createChecksheet(inspector, payload());
    await transitionChecksheet(inspector, doc.id, "SUBMIT", undefined);

    await expect(transitionChecksheet(checker, doc.id, "APPROVE", "skip")).rejects.toThrow(
      /tidak diizinkan/,
    );
  });

  it("mewajibkan komentar untuk reject dan return", async () => {
    const inspector = await contextFor("wf_r_inspector", "INSPECTOR");
    const checker = await contextFor("wf_r_checker", "CHECKED");
    const doc = await createChecksheet(inspector, payload());
    await transitionChecksheet(inspector, doc.id, "SUBMIT", undefined);

    await expect(transitionChecksheet(checker, doc.id, "REJECT", "  ")).rejects.toThrow(/Komentar/);
    await expect(transitionChecksheet(checker, doc.id, "REJECT", "Dimensi salah")).resolves.toEqual(
      expect.objectContaining({ status: "REJECTED" }),
    );
  });

  it("inspector dapat memperbaiki dan submit ulang dokumen yang ditolak", async () => {
    const inspector = await contextFor("wf_re_inspector", "INSPECTOR");
    const checker = await contextFor("wf_re_checker", "CHECKED");
    const doc = await createChecksheet(inspector, payload());
    await transitionChecksheet(inspector, doc.id, "SUBMIT", undefined);
    await transitionChecksheet(checker, doc.id, "RETURN", "Perbaiki lot");

    const resubmitted = await transitionChecksheet(inspector, doc.id, "SUBMIT", "Sudah diperbaiki");
    expect(resubmitted.status).toBe("SUBMITTED");

    const history = await listDecisions(inspector, doc.id);
    expect(history.map((d) => d.action)).toEqual(["SUBMIT", "RETURN", "SUBMIT"]);
  });

  it("menolak submit bila snapshot belum lengkap", async () => {
    const inspector = await contextFor("wf_incomplete", "INSPECTOR");
    const doc = await createChecksheet(inspector, payload({ itemSnapshot: {}, totalItems: 3 }));

    await expect(transitionChecksheet(inspector, doc.id, "SUBMIT", undefined)).rejects.toThrow(
      /belum lengkap/,
    );
  });

  it("mengizinkan submit walau field turunan opsional kosong", async () => {
    const inspector = await contextFor("wf_optional", "INSPECTOR");
    const doc = await createChecksheet(
      inspector,
      payload({
        headerSnapshot: {
          partNo: "7145-0040-0w",
          partName: "COLLAR",
          lotNo: "LOT-WF-001",
          model: "",
          moldCode: "",
          drawingRev: "",
        },
      }),
    );

    await expect(
      transitionChecksheet(inspector, doc.id, "SUBMIT", undefined),
    ).resolves.toEqual(expect.objectContaining({ status: "SUBMITTED" }));
  });

  it("mencegah dua keputusan konkuren pada status yang sama", async () => {
    const inspector = await contextFor("wf_race_inspector", "INSPECTOR");
    const checkerA = await contextFor("wf_race_a", "CHECKED");
    const checkerB = await contextFor("wf_race_b", "CHECKED");
    const doc = await createChecksheet(inspector, payload());
    await transitionChecksheet(inspector, doc.id, "SUBMIT", undefined);

    const results = await Promise.allSettled([
      transitionChecksheet(checkerA, doc.id, "CHECK", "A"),
      transitionChecksheet(checkerB, doc.id, "CHECK", "B"),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(await prisma.checksheetDecision.count()).toBe(2);
  });

  it("tidak mengizinkan aksi setelah approved", async () => {
    const inspector = await contextFor("wf_final_inspector", "INSPECTOR");
    const checker = await contextFor("wf_final_checker", "CHECKED");
    const approver = await contextFor("wf_final_approver", "APPROVED");
    const doc = await createChecksheet(inspector, payload());
    await transitionChecksheet(inspector, doc.id, "SUBMIT", undefined);
    await transitionChecksheet(checker, doc.id, "CHECK", "ok");
    await transitionChecksheet(approver, doc.id, "APPROVE", "ok");

    await expect(transitionChecksheet(approver, doc.id, "APPROVE", "lagi")).rejects.toThrow();
  });
});
