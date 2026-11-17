import { describe, expect, it } from "vitest";
import type { RoleCode } from "@prisma/client";
import {
  assertCan,
  assertOwnership,
  can,
  ForbiddenError,
  type AuthzContext,
} from "@/server/authz/guard";
import { permissionsOf } from "@/server/authz/permissions";

function makeCtx(
  roles: { role: RoleCode; plantId: string }[],
  userId = "user-1",
): AuthzContext {
  return {
    sessionId: "sess-1",
    userId,
    username: "tester",
    fullName: "Tester",
    email: "tester@example.test",
    roles,
    plantIds: Array.from(new Set(roles.map((r) => r.plantId))),
    activePlantId: roles[0]?.plantId ?? null,
    permissions: permissionsOf({ roles }),
  };
}

describe("can()", () => {
  it("menolak permission yang tidak dimiliki", () => {
    const ctx = makeCtx([{ role: "INSPECTOR", plantId: "p1" }]);
    expect(can(ctx, "checksheet.create")).toBe(true);
    expect(can(ctx, "user.manage")).toBe(false);
  });

  it("mengizinkan aksi pada plant yang diizinkan", () => {
    const ctx = makeCtx([{ role: "INSPECTOR", plantId: "p1" }]);
    expect(can(ctx, "checksheet.create", { plantId: "p1" })).toBe(true);
  });

  it("menolak aksi pada plant lain (scope plant)", () => {
    const ctx = makeCtx([{ role: "INSPECTOR", plantId: "p1" }]);
    expect(can(ctx, "checksheet.create", { plantId: "p2" })).toBe(false);
  });

  it("mengizinkan plant yang tercakup pada salah satu peran", () => {
    const ctx = makeCtx([
      { role: "INSPECTOR", plantId: "p1" },
      { role: "INSPECTOR", plantId: "p2" },
    ]);
    expect(can(ctx, "checksheet.create", { plantId: "p2" })).toBe(true);
  });

  it("menghormati requiredRoles", () => {
    const ctx = makeCtx([{ role: "CHECKED", plantId: "p1" }]);
    expect(can(ctx, "checksheet.check", { requiredRoles: ["CHECKED"] })).toBe(true);
    expect(can(ctx, "checksheet.check", { requiredRoles: ["APPROVED"] })).toBe(false);
  });

  it("ADMIN lolos requiredRoles hanya bila memang punya role tsb", () => {
    const admin = makeCtx([{ role: "ADMIN", plantId: "p1" }]);
    expect(can(admin, "checksheet.approve", { requiredRoles: ["APPROVED"] })).toBe(false);
  });
});

describe("assertCan()", () => {
  it("tidak melempar bila diizinkan", () => {
    const ctx = makeCtx([{ role: "ADMIN", plantId: "p1" }]);
    expect(() => assertCan(ctx, "user.manage")).not.toThrow();
  });

  it("melempar ForbiddenError bila tidak diizinkan", () => {
    const ctx = makeCtx([{ role: "VIEWER", plantId: "p1" }]);
    expect(() => assertCan(ctx, "master.write")).toThrow(ForbiddenError);
  });
});

describe("assertOwnership()", () => {
  it("mengizinkan pemilik resource", () => {
    const ctx = makeCtx([{ role: "INSPECTOR", plantId: "p1" }], "user-1");
    expect(() => assertOwnership(ctx, "user-1", "checksheet.edit")).not.toThrow();
  });

  it("menolak non-pemilik", () => {
    const ctx = makeCtx([{ role: "INSPECTOR", plantId: "p1" }], "user-1");
    expect(() => assertOwnership(ctx, "user-2", "checksheet.edit")).toThrow(ForbiddenError);
  });

  it("ADMIN boleh mengubah milik siapa pun", () => {
    const ctx = makeCtx([{ role: "ADMIN", plantId: "p1" }], "admin-1");
    expect(() => assertOwnership(ctx, "user-2", "checksheet.edit")).not.toThrow();
  });
});
