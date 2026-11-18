import { getSessionContext } from "@/server/auth/session";
import { permissionsOf } from "@/server/authz/permissions";
import { prisma } from "@/server/db/client";
import { businessPartners, machines, materials, parts } from "@/lib/mock/data";
import { DashboardClient } from "./dashboard-client";

export interface DashboardMetrics {
  totalInspections: number;
  passRate: number;
  ngCount: number;
  pendingApproval: number;
  openNcr: number;
  byStatus: { DRAFT: number; SUBMITTED: number; CHECKED: number; APPROVED: number; REJECTED: number };
  openActions: number;
  overdueNcr: number;
}

async function persistedMetrics(): Promise<DashboardMetrics> {
  const session = await getSessionContext();
  const empty: DashboardMetrics = {
    totalInspections: 0,
    passRate: 0,
    ngCount: 0,
    pendingApproval: 0,
    openNcr: 0,
    byStatus: { DRAFT: 0, SUBMITTED: 0, CHECKED: 0, APPROVED: 0, REJECTED: 0 },
    openActions: 0,
    overdueNcr: 0,
  };
  if (!session) return empty;

  const permissions = permissionsOf(session);
  const canViewAll = permissions.has("checksheet.view.all");
  const scope = {
    plantId: { in: session.plantIds },
    ...(canViewAll ? {} : { createdById: session.userId }),
  };

  const [grouped, ncrStats, overdue] = await Promise.all([
    prisma.checksheet.groupBy({
      by: ["status", "finalJudgment"],
      where: scope,
      _count: { _all: true },
    }),
    prisma.ncr.groupBy({
      by: ["status"],
      where: { plantId: { in: session.plantIds } },
      _count: { _all: true },
    }),
    prisma.ncr.count({
      where: {
        plantId: { in: session.plantIds },
        status: { notIn: ["CLOSED", "CANCELLED"] },
        targetDate: { lt: new Date() },
      },
    }),
  ]);

  const byStatus = { ...empty.byStatus };
  let total = 0;
  let ok = 0;
  let ng = 0;

  for (const row of grouped) {
    const count = row._count._all;
    total += count;
    if (row.finalJudgment === "OK") ok += count;
    if (row.finalJudgment === "NG") ng += count;
    if (row.status in byStatus) byStatus[row.status as keyof typeof byStatus] += count;
  }

  const openStatuses = new Set(["OPEN", "CONTAINED", "IN_ACTION", "VERIFIED"]);
  const openNcr = ncrStats
    .filter((row) => openStatuses.has(row.status))
    .reduce((sum, row) => sum + row._count._all, 0);

  return {
    totalInspections: total,
    passRate: total === 0 ? 0 : Math.round((ok / total) * 1000) / 10,
    ngCount: ng,
    pendingApproval: byStatus.SUBMITTED + byStatus.CHECKED,
    openNcr,
    byStatus,
    openActions: openNcr,
    overdueNcr: overdue,
  };
}

async function recentChecksheets() {
  const session = await getSessionContext();
  if (!session) return [];
  const rows = await prisma.checksheet.findMany({
    where: { plantId: { in: session.plantIds } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  return rows.map((row) => ({
    id: row.id,
    number: row.number,
    formCode: row.formCode,
    formName: row.formName,
    category: "IN_PROCESS" as const,
    partNo: row.partNoSnapshot,
    partName: row.partNameSnapshot,
    lotNo: row.lotNoSnapshot,
    inspectionDate: row.inspectionDate.toISOString().slice(0, 10),
    status: row.status,
    finalJudgment: row.finalJudgment,
    inspectorName: row.createdById,
    totalItems: row.totalItems,
    ngItems: row.ngItems,
  }));
}

export default async function DashboardPage() {
  const [metrics, recent] = await Promise.all([
    persistedMetrics().catch(() => null),
    recentChecksheets().catch(() => []),
  ]);

  return (
    <DashboardClient
      metrics={metrics}
      recent={recent}
      counts={{
        partners: businessPartners.length,
        materials: materials.length,
        parts: parts.length,
        machines: machines.length,
      }}
    />
  );
}
