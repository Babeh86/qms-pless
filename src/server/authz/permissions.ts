import type { RoleCode } from "@prisma/client";

/**
 * Matriks permission × role (SPEC-0001 §4.1).
 * Ini adalah SATU-SATUNYA sumber kebenaran otorisasi.
 */

export const ALL_PERMISSIONS = [
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
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export const ALL_ROLES = [
  "ADMIN",
  "MD_ADMIN",
  "INSPECTOR",
  "CHECKED",
  "APPROVED",
  "VIEWER",
] as const satisfies readonly RoleCode[];

const ADMIN_PERMISSIONS: readonly Permission[] = ALL_PERMISSIONS;

const MD_ADMIN_PERMISSIONS: readonly Permission[] = [
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
];

const INSPECTOR_PERMISSIONS: readonly Permission[] = [
  "master.read",
  "partner.quickadd",
  "template.read",
  "checksheet.create",
  "checksheet.edit",
  "checksheet.submit",
  "checksheet.export",
  "ncr.read",
  "ncr.create",
];

const CHECKED_PERMISSIONS: readonly Permission[] = [
  "master.read",
  "partner.quickadd",
  "template.read",
  "checksheet.check",
  "checksheet.view.all",
  "checksheet.export",
  "ncr.read",
  "ncr.create",
  "ncr.manage",
];

const APPROVED_PERMISSIONS: readonly Permission[] = [
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
];

const VIEWER_PERMISSIONS: readonly Permission[] = [
  "master.read",
  "template.read",
  "checksheet.view.all",
  "checksheet.export",
  "audit.read",
  "export.master",
  "ncr.read",
];

export const ROLE_PERMISSIONS: Record<RoleCode, readonly Permission[]> = {
  ADMIN: ADMIN_PERMISSIONS,
  MD_ADMIN: MD_ADMIN_PERMISSIONS,
  INSPECTOR: INSPECTOR_PERMISSIONS,
  CHECKED: CHECKED_PERMISSIONS,
  APPROVED: APPROVED_PERMISSIONS,
  VIEWER: VIEWER_PERMISSIONS,
};

/** Permission yang hanya boleh dilakukan pada resource milik sendiri. */
export const OWNER_SCOPED_PERMISSIONS: ReadonlySet<Permission> = new Set<Permission>([
  "checksheet.edit",
  "checksheet.submit",
  "checksheet.export",
]);

export interface PrincipalRoles {
  roles: { role: RoleCode; plantId: string }[];
}

/** Menghimpun seluruh permission dari semua role yang dimiliki. */
export function permissionsOf(principal: PrincipalRoles): Set<Permission> {
  const result = new Set<Permission>();
  for (const { role } of principal.roles) {
    for (const permission of ROLE_PERMISSIONS[role]) result.add(permission);
  }
  return result;
}
