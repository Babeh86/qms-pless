import { getSessionContext } from "@/server/auth/session";
import { permissionsOf } from "@/server/authz/permissions";
import { prisma } from "@/server/db/client";
import type { Checksheet } from "@/lib/mock/types";
import { checksheets as sampleChecksheets } from "@/lib/mock/data";
import { ApprovalClient } from "./approval-client";

/**
 * Approval queue reads persisted checksheets first. Bundled samples are shown only
 * when the database has no queue yet, so a fresh demo still has content.
 */
async function persistedQueue(): Promise<Checksheet[]> {
  const session = await getSessionContext();
  if (!session) return [];

  const permissions = permissionsOf(session);
  const canCheck = permissions.has("checksheet.check");
  const canApprove = permissions.has("checksheet.approve");
  if (!canCheck && !canApprove) return [];

  const statuses = [canCheck ? "SUBMITTED" : null, canApprove ? "CHECKED" : null].filter(
    (value): value is "SUBMITTED" | "CHECKED" => value !== null,
  );

  const rows = await prisma.checksheet.findMany({
    where: { plantId: { in: session.plantIds }, status: { in: statuses } },
    orderBy: { submittedAt: "asc" },
    take: 100,
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

export default async function ApprovalPage() {
  const persisted = await persistedQueue().catch(() => []);
  const data = persisted.length > 0 ? persisted : sampleChecksheets;
  return <ApprovalClient checksheets={data} usingSamples={persisted.length === 0} />;
}
