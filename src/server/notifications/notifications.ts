import { prisma } from "@/server/db/client";
import { permissionsOf } from "@/server/authz/permissions";
import type { SessionContext } from "@/server/auth/session";
import { allowedActions } from "@/lib/checksheet-workflow";

/**
 * Notification feed derived from persisted state — never from mock data.
 * Each item is something the current role can act on or should be aware of.
 */

export interface AppNotification {
  id: string;
  kind: "approval" | "ncr";
  titleKey: string;
  detail: string;
  href: string;
  count: number;
}

export async function getNotifications(session: SessionContext): Promise<AppNotification[]> {
  const permissions = permissionsOf(session);
  const notifications: AppNotification[] = [];

  // Which queue a role can actually act on comes from the workflow matrix, not
  // raw permissions — otherwise an approver would be told about sheets it can
  // never check.
  const role = session.roles[0]?.role ?? "VIEWER";
  const pendingStatuses: ("SUBMITTED" | "CHECKED")[] = [];
  if (allowedActions(role, "SUBMITTED").length > 0) pendingStatuses.push("SUBMITTED");
  if (allowedActions(role, "CHECKED").length > 0) pendingStatuses.push("CHECKED");

  if (pendingStatuses.length > 0) {

    const pending = await prisma.checksheet.count({
      where: { plantId: { in: session.plantIds }, status: { in: pendingStatuses } },
    });
    if (pending > 0) {
      notifications.push({
        id: "pending-approval",
        kind: "approval",
        titleKey: "notifications.pendingApproval",
        detail: `${pending}`,
        href: "/approval",
        count: pending,
      });
    }
  }

  if (permissions.has("ncr.read")) {
    const [openNcr, overdue] = await Promise.all([
      prisma.ncr.count({
        where: {
          plantId: { in: session.plantIds },
          status: { in: ["OPEN", "CONTAINED", "IN_ACTION", "VERIFIED"] },
        },
      }),
      prisma.ncr.count({
        where: {
          plantId: { in: session.plantIds },
          status: { notIn: ["CLOSED", "CANCELLED"] },
          targetDate: { lt: new Date() },
        },
      }),
    ]);

    if (overdue > 0) {
      notifications.push({
        id: "ncr-overdue",
        kind: "ncr",
        titleKey: "notifications.ncrOverdue",
        detail: `${overdue}`,
        href: "/ncr",
        count: overdue,
      });
    }
    if (openNcr > 0) {
      notifications.push({
        id: "ncr-open",
        kind: "ncr",
        titleKey: "notifications.ncrOpen",
        detail: `${openNcr}`,
        href: "/ncr",
        count: openNcr,
      });
    }
  }

  return notifications;
}
