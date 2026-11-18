"use client";

import { CloudOff, CloudUpload, RefreshCw, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOfflineSync } from "./offline-sync-provider";

/**
 * Compact sync status. Only appears when something needs the inspector's attention
 * (offline, queued, or failed) so it does not add noise during normal online work.
 */
export function OfflineStatusBanner() {
  const t = useTranslations("offline");
  const { online, pending, failed, syncing, lastSyncedAt, flush } = useOfflineSync();

  if (online && pending === 0 && failed === 0 && !syncing) {
    if (!lastSyncedAt) return null;
    return (
      <p className="flex items-center justify-end gap-1.5 px-1 pb-1 text-[10px] text-success-600">
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        {t("syncedAt", {
          time: new Date(lastSyncedAt).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        })}
      </p>
    );
  }

  const tone = failed > 0 ? "danger" : online ? "warning" : "neutral";

  return (
    <div
      role="status"
      className={
        "mb-3 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-medium " +
        (tone === "danger"
          ? "border-danger-500/30 bg-danger-50 text-danger-700"
          : tone === "warning"
            ? "border-warning-500/30 bg-warning-50 text-warning-800"
            : "border-ink-300 bg-ink-50 text-ink-700")
      }
    >
      {online ? (
        <CloudUpload className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <CloudOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
      <span>
        {!online
          ? t("offline", { count: pending })
          : syncing
            ? t("syncing")
            : failed > 0
              ? t("failed", { count: failed })
              : t("pending", { count: pending })}
      </span>
      <button
        type="button"
        onClick={flush}
        disabled={!online || syncing}
        className="ml-auto inline-flex items-center gap-1 rounded-md border border-current/20 px-2 py-1 text-[10px] font-semibold disabled:opacity-50"
      >
        <RefreshCw className={"h-3 w-3 " + (syncing ? "animate-spin" : "")} aria-hidden="true" />
        {t("retry")}
      </button>
    </div>
  );
}
