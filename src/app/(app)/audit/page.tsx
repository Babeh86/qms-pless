import { getTranslations } from "next-intl/server";
import { listAudit } from "@/server/audit/audit";
import { requirePermission } from "@/server/authz/guard";
import { AuditClient, type AuditEntry } from "./audit-client";

const SUMMARY_FALLBACK: Record<string, string> = {
  "audit.login.success": "Berhasil masuk ke sistem",
  "audit.login.failed": "Percobaan masuk gagal",
  "audit.logout": "Keluar dari sistem",
};

export default async function AuditPage() {
  await requirePermission("audit.read");
  const t = await getTranslations("audit");

  let entries: AuditEntry[] = [];

  try {
    const result = await listAudit({ page: 1, pageSize: 200 });
    entries = result.items.map((item) => ({
      id: item.id,
      at: new Intl.DateTimeFormat("id-ID", {
        dateStyle: "short",
        timeStyle: "medium",
        timeZone: "Asia/Jakarta",
      }).format(item.at),
      actorName: item.actorName ?? "—",
      action: item.action,
      entity: item.entity,
      summary:
        SUMMARY_FALLBACK[item.summaryKey] ??
        item.summaryKey.replace(/^audit\./, "").replaceAll(".", " · "),
      ip: item.ipAddress ?? "—",
    }));
  } catch {
    entries = [];
  }

  void t;

  return <AuditClient entries={entries} />;
}
