"use client";

import { useState } from "react";
import { useOfflineSync } from "@/components/offline/offline-sync-provider";

export interface DraftPayload {
  formCode: string;
  formName: string;
  templateRevision: string;
  partNo: string;
  partName: string;
  supplierSnapshot?: string;
  customerSnapshot?: string;
  lotNo: string;
  inspectionDate: string;
  headerSnapshot: Record<string, string>;
  itemSnapshot: Record<string, string>;
  remarksSnapshot?: Record<string, string>;
  totalItems: number;
  ngItems: number;
  finalJudgment: "OK" | "NG" | null;
}

export type DraftSaveState = "idle" | "saving" | "saved" | "error";

/**
 * Saves a checksheet draft immediately (not a submission/approval).
 * The idempotency key is stable for this form session so retries do not duplicate.
 * Returns the persisted document id so attachments can be linked to it.
 */
export function useSaveDraft() {
  const [state, setState] = useState<DraftSaveState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const { online, enqueueDraft } = useOfflineSync();
  // State (not a ref) so the key can be passed to child components during render.
  const [idempotencyKey] = useState(() =>
    typeof crypto === "undefined" ? "draft-session" : crypto.randomUUID(),
  );

  async function saveDraft(payload: DraftPayload): Promise<string | null> {
    setState("saving");
    setMessage(null);

    if (!online) {
      enqueueDraft(idempotencyKey, payload);
      setState("saved");
      setMessage("Draft disimpan di perangkat dan akan disinkronkan otomatis.");
      return null;
    }

    try {
      const response = await fetch(
        savedId ? `/api/checksheets/${savedId}` : "/api/checksheets",
        {
          method: savedId ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            savedId
              ? {
                  headerSnapshot: payload.headerSnapshot,
                  itemSnapshot: payload.itemSnapshot,
                  remarksSnapshot: payload.remarksSnapshot,
                  totalItems: payload.totalItems,
                  ngItems: payload.ngItems,
                  finalJudgment: payload.finalJudgment,
                }
              : { ...payload, idempotencyKey: idempotencyKey },
          ),
        },
      );

      if (!response.ok) {
        setState("error");
        setMessage(
          response.status === 401 || response.status === 403
            ? "Anda tidak memiliki izin menyimpan draft."
            : "Draft gagal disimpan. Periksa kelengkapan data lalu coba lagi.",
        );
        return null;
      }

      const record: { id: string } = await response.json();
      setSavedId(record.id);
      setState("saved");
      setMessage("Draft tersimpan di server.");
      return record.id;
    } catch {
      enqueueDraft(idempotencyKey, payload);
      setState("saved");
      setMessage("Koneksi terputus. Draft disimpan di perangkat dan akan disinkronkan otomatis.");
      return null;
    }
  }

  return { state, message, saveDraft, savedId, draftKey: idempotencyKey };
}
