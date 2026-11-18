import { getSessionContext } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import type { Checksheet } from "@/lib/mock/types";
import { checksheets as sampleChecksheets } from "@/lib/mock/data";
import { ReportsClient } from "./reports-client";

/**
 * Reports and the NG register read persisted checksheets first. Bundled samples are
 * used only when there is no persisted data yet, so a fresh demo still renders.
 */
async function persistedChecksheets(): Promise<Checksheet[]> {
  const session = await getSessionContext();
  if (!session) return [];

  const rows = await prisma.checksheet.findMany({
    where: { plantId: { in: session.plantIds } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  return rows.map((row) => ({
    id: row.id,
    number: row.number,
    formCode: row.formCode,
    formName: row.formName,
    category: "IN_PROCESS",
    partNo: row.partNoSnapshot,
    partName: row.partNameSnapshot,
    ...(row.supplierSnapshot ? { supplierCode: row.supplierSnapshot } : {}),
    ...(row.customerSnapshot ? { customerName: row.customerSnapshot } : {}),
    lotNo: row.lotNoSnapshot,
    inspectionDate: row.inspectionDate.toISOString().slice(0, 10),
    status: row.status,
    finalJudgment: row.finalJudgment,
    inspectorName: row.createdById,
    totalItems: row.totalItems,
    ngItems: row.ngItems,
  }));
}

export default async function ReportsPage() {
  const persisted = await persistedChecksheets().catch(() => []);
  const data = persisted.length > 0 ? persisted : sampleChecksheets;
  return <ReportsClient checksheets={data} usingSamples={persisted.length === 0} />;
}
