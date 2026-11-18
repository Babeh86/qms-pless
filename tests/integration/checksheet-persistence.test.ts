import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { prisma, resetDatabase, seedUser } from "./helpers";
import { permissionsOf } from "@/server/authz/permissions";
import type { AuthzContext } from "@/server/authz/guard";
import {
  createChecksheet,
  getChecksheet,
  updateChecksheetDraft,
} from "@/server/checksheet/checksheet-service";
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

async function inspectorContext(
  username: string,
  role: "INSPECTOR" | "CHECKED" = "INSPECTOR",
): Promise<AuthzContext> {
  const { plantId, userId } = await seedUser(username, role);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const roles = [{ role, plantId }];
  const principal = { roles };
  return {
    sessionId: "test-session",
    userId,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    roles,
    plantIds: [plantId],
    activePlantId: plantId,
    permissions: permissionsOf(principal),
  };
}

function payload(idempotencyKey?: string): ChecksheetCreateInput {
  return {
    formCode: "CS-01",
    formName: "Incoming Material COLLAR",
    templateRevision: "2025-01",
    partNo: "7145-0040-0w",
    partName: "COLLAR",
    supplierSnapshot: "PT. PASI",
    lotNo: "LOT-20261117-001",
    inspectionDate: "2026-11-17",
    headerSnapshot: {
      partNo: "7145-0040-0w",
      partName: "COLLAR",
      supplier: "PT. PASI",
      material: "POM-1C NATURAL",
      lotNo: "LOT-20261117-001",
    },
    itemSnapshot: { "flat:0:0": "OK", "flat:0:1": "NG" },
    remarksSnapshot: { "remark:flat:0:1": "Burr terdeteksi" },
    totalItems: 2,
    ngItems: 1,
    finalJudgment: "NG",
    ...(idempotencyKey ? { idempotencyKey } : {}),
  };
}

describe("checksheet persistence — integration", () => {
  it("menyimpan snapshot lengkap dan mengembalikannya identik setelah dibuka ulang", async () => {
    const ctx = await inspectorContext("inspector_snapshot");

    const created = await createChecksheet(ctx, payload());
    const reopened = await getChecksheet(ctx, created.id);

    expect(reopened).not.toBeNull();
    expect(reopened?.headerSnapshot).toEqual(payload().headerSnapshot);
    expect(reopened?.itemSnapshot).toEqual(payload().itemSnapshot);
    expect(reopened?.remarksSnapshot).toEqual(payload().remarksSnapshot);
    expect(reopened?.finalJudgment).toBe("NG");
    expect(reopened?.status).toBe("DRAFT");
  });

  it("idempotency key mencegah duplikasi dokumen pada retry", async () => {
    const ctx = await inspectorContext("inspector_retry");
    const key = "retry-key-20261117";

    const first = await createChecksheet(ctx, payload(key));
    const second = await createChecksheet(ctx, payload(key));

    expect(second.id).toBe(first.id);
    expect(await prisma.checksheet.count()).toBe(1);
  });

  it("menolak inspector lain mengakses dokumen milik orang lain", async () => {
    const owner = await inspectorContext("inspector_owner");
    const other = await inspectorContext("inspector_other");
    const created = await createChecksheet(owner, payload());

    await expect(getChecksheet(other, created.id)).rejects.toThrow(/milik sendiri/);
  });

  it("memperbarui draft tanpa mengubah nomor dokumen", async () => {
    const ctx = await inspectorContext("inspector_update");
    const created = await createChecksheet(ctx, payload());

    const updated = await updateChecksheetDraft(ctx, created.id, {
      itemSnapshot: { "flat:0:0": "NG" },
      ngItems: 2,
    });

    expect(updated.number).toBe(created.number);
    expect(updated.itemSnapshot).toEqual({ "flat:0:0": "NG" });
    expect(updated.ngItems).toBe(2);
  });

  it("menolak update lokal yang lebih lama (latest edit wins di server)", async () => {
    const ctx = await inspectorContext("inspector_conflict");
    const created = await createChecksheet(ctx, payload());

    // A stale client edit must not overwrite the newer stored version.
    await expect(
      updateChecksheetDraft(ctx, created.id, {
        itemSnapshot: { "flat:0:0": "NG" },
        clientUpdatedAt: "2020-01-01T00:00:00.000Z",
      }),
    ).rejects.toThrow(/lebih baru/);

    // The same edit from a newer client is accepted.
    const accepted = await updateChecksheetDraft(ctx, created.id, {
      itemSnapshot: { "flat:0:0": "NG" },
      clientUpdatedAt: new Date(Date.now() + 60_000).toISOString(),
    });
    expect(accepted.itemSnapshot).toEqual({ "flat:0:0": "NG" });
  });

  it("menolak mengubah dokumen yang sudah tidak berstatus draft", async () => {
    const ctx = await inspectorContext("inspector_submitted");
    const created = await createChecksheet(ctx, payload());
    await prisma.checksheet.update({
      where: { id: created.id },
      data: { status: "SUBMITTED" },
    });

    await expect(
      updateChecksheetDraft(ctx, created.id, { itemSnapshot: { "flat:0:0": "OK" } }),
    ).rejects.toThrow(/draft/i);
  });

  it("membuat nomor dokumen dengan kode plant, bukan id internal", async () => {
    const ctx = await inspectorContext("inspector_number");
    const created = await createChecksheet(ctx, payload());

    expect(created.number).toMatch(/^CS\/\d{4}\/TST\/\d{4}$/);
    expect(created.number).not.toContain(ctx.activePlantId ?? "never");
  });

  it("mencatat audit CREATE dan UPDATE untuk checksheet", async () => {
    const ctx = await inspectorContext("inspector_audit");
    const created = await createChecksheet(ctx, payload());
    await updateChecksheetDraft(ctx, created.id, { ngItems: 0 });

    const actions = await prisma.auditLog.findMany({
      where: { entity: "Checksheet", entityId: created.id },
      select: { action: true },
    });
    expect(actions.map((row) => row.action)).toEqual(
      expect.arrayContaining(["CREATE", "UPDATE"]),
    );
  });
});
