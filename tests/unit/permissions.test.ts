import { describe, expect, it } from "vitest";
import type { RoleCode } from "@prisma/client";
import {
  ALL_PERMISSIONS,
  ALL_ROLES,
  ROLE_PERMISSIONS,
  permissionsOf,
  type Permission,
} from "@/server/authz/permissions";

/**
 * T13 — Matriks permission × role (120 kasus).
 * Diekspektasi eksplisit agar perubahan tidak sengaja lolos.
 */

type Matrix = Record<RoleCode, Permission[]>;

const EXPECTED: Matrix = {
  ADMIN: [
    "user.manage",
    "role.assign",
    "plant.manage",
    "numbering.manage",
    "shift.manage",
    "master.read",
    "master.write",
    "partner.quickadd",
    "template.read",
    "template.write",
    "checksheet.create",
    "checksheet.edit",
    "checksheet.submit",
    "checksheet.check",
    "checksheet.approve",
    "checksheet.view.all",
    "checksheet.export",
    "audit.read",
    "import.run",
    "export.master",
    "ncr.read",
    "ncr.create",
    "ncr.manage",
  ],
  MD_ADMIN: [
    "numbering.manage",
    "shift.manage",
    "master.read",
    "master.write",
    "partner.quickadd",
    "template.read",
    "template.write",
    "checksheet.view.all",
    "checksheet.export",
    "import.run",
    "export.master",
    "ncr.read",
  ],
  INSPECTOR: [
    "master.read",
    "partner.quickadd",
    "template.read",
    "checksheet.create",
    "checksheet.edit",
    "checksheet.submit",
    "checksheet.export",
    "ncr.read",
    "ncr.create",
  ],
  CHECKED: [
    "master.read",
    "partner.quickadd",
    "template.read",
    "checksheet.check",
    "checksheet.view.all",
    "checksheet.export",
    "ncr.read",
    "ncr.create",
    "ncr.manage",
  ],
  APPROVED: [
    "master.read",
    "partner.quickadd",
    "template.read",
    "checksheet.check",
    "checksheet.approve",
    "checksheet.view.all",
    "checksheet.export",
    "export.master",
    "ncr.read",
    "ncr.manage",
  ],
  VIEWER: [
    "master.read",
    "template.read",
    "checksheet.view.all",
    "checksheet.export",
    "audit.read",
    "export.master",
    "ncr.read",
  ],
};

describe("ROLE_PERMISSIONS", () => {
  it("mencakup seluruh 23 permission dan 6 role", () => {
    expect(ALL_PERMISSIONS).toHaveLength(23);
    expect(ALL_ROLES).toHaveLength(6);
  });

  describe.each(ALL_ROLES)("role %s", (role) => {
    const expected = new Set<Permission>(EXPECTED[role]);
    const actual = new Set<Permission>(ROLE_PERMISSIONS[role]);

    it("jumlah permission sesuai ekspektasi", () => {
      expect(actual.size).toBe(expected.size);
    });

    it.each(ALL_PERMISSIONS)("permission %s sesuai matriks", (permission) => {
      expect(actual.has(permission)).toBe(expected.has(permission));
    });
  });
});

describe("permissionsOf", () => {
  it("menghimpun permission dari peran tunggal", () => {
    const result = permissionsOf({ roles: [{ role: "VIEWER", plantId: "p1" }] });
    expect(result.has("audit.read")).toBe(true);
    expect(result.has("master.write")).toBe(false);
  });

  it("menggabungkan permission dari beberapa peran (union)", () => {
    const result = permissionsOf({
      roles: [
        { role: "INSPECTOR", plantId: "p1" },
        { role: "CHECKED", plantId: "p1" },
      ],
    });
    expect(result.has("checksheet.create")).toBe(true); // dari INSPECTOR
    expect(result.has("checksheet.check")).toBe(true); // dari CHECKED
    expect(result.has("checksheet.approve")).toBe(false); // tidak ada di keduanya
  });

  it("ADMIN memperoleh seluruh permission", () => {
    const result = permissionsOf({ roles: [{ role: "ADMIN", plantId: "p1" }] });
    expect(result.size).toBe(ALL_PERMISSIONS.length);
  });

  it("user tanpa peran tidak punya permission", () => {
    expect(permissionsOf({ roles: [] }).size).toBe(0);
  });

  it("peran duplikat pada plant berbeda tidak menambah permission ganda", () => {
    const result = permissionsOf({
      roles: [
        { role: "VIEWER", plantId: "p1" },
        { role: "VIEWER", plantId: "p2" },
      ],
    });
    expect(result.size).toBe(EXPECTED.VIEWER.length);
  });
});
