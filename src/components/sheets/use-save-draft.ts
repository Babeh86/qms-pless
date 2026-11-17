"use client";

import { useRef, useState } from "react";

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
 */
export function useSaveDraft() {
  const [state, setState] = useState<DraftSaveState>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const savedId = useRef<string | null>(null);
  const idempotencyKey = useRef(
    typeof crypto === "undefined" ? "draft-session" : crypto.randomUUID(),
  );

  async function saveDraft(payload: DraftPayload): Promise<boolean> {
    setState("saving");
    setMessage(null);

    try {
      const response = await fetch(
        savedId.current ? `/api/checksheets/${savedId.current}` : "/api/checksheets",
        {
          method: savedId.current ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            savedId.current
              ? {
                  headerSnapshot: payload.headerSnapshot,
                  itemSnapshot: payload.itemSnapshot,
                  remarksSnapshot: payload.remarksSnapshot,
                  totalItems: payload.totalItems,
                  ngItems: payload.ngItems,
                  finalJudgment: payload.finalJudgment,
                }
              : { ...payload, idempotencyKey: idempotencyKey.current },
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
        return false;
      }

      const record: { id: string } = await response.json();
      savedId.current = record.id;
      setState("saved");
      setMessage("Draft tersimpan di server.");
      return true;
    } catch {
      setState("error");
      setMessage("Koneksi gagal. Draft belum tersimpan.");
      return false;
    }
  }

  return { state, message, saveDraft };
}
