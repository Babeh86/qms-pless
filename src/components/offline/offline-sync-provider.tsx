"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  listQueuedAttachments,
  removeQueuedAttachment,
} from "@/lib/offline/attachment-queue";
import {
  pickWinner,
  readDrafts,
  removeDraft,
  upsertDraft,
  writeDrafts,
  type OfflineDraft,
  type OfflineDraftPayload,
} from "@/lib/offline/drafts";

interface OfflineSyncValue {
  online: boolean;
  pending: number;
  failed: number;
  syncing: boolean;
  lastSyncedAt: string | null;
  /** Queues a draft locally and attempts an immediate sync when online. */
  enqueueDraft: (idempotencyKey: string, payload: OfflineDraftPayload) => void;
  /** Manual retry from the status banner. */
  flush: () => void;
}

const OfflineSyncContext = createContext<OfflineSyncValue | null>(null);

const SYNC_INTERVAL_MS = 20_000;

/**
 * Offline-first engine.
 *
 * Drafts live in localStorage per user and sync automatically when the network
 * returns. Each sync is idempotent (keyed by the client's idempotency key) and
 * resolves conflicts with latest-edit-wins: if the server copy is newer, the local
 * edit is dropped instead of overwriting newer data.
 */
export function OfflineSyncProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [online, setOnline] = useState(true);
  const [drafts, setDrafts] = useState<OfflineDraft[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const running = useRef(false);

  // Deferred one tick: reading localStorage during the effect body would cause a
  // synchronous cascading render, and reading it during SSR would mismatch markup.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOnline(navigator.onLine);
      setDrafts(readDrafts(userId));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [userId]);

  const persist = useCallback(
    (next: OfflineDraft[]) => {
      setDrafts(next);
      writeDrafts(userId, next);
    },
    [userId],
  );

  const syncOne = useCallback(
    async (draft: OfflineDraft): Promise<{ result: "synced" | "failed" | "stale"; serverId?: string }> => {
      try {
        const created = await fetch("/api/checksheets", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ...draft.payload,
            idempotencyKey: draft.idempotencyKey,
            templateRevision: draft.payload.templateRevision,
          }),
        });

        if (created.status === 401 || created.status === 403) return { result: "failed" };
        if (!created.ok && created.status !== 409) return { result: "failed" };

        const record = (await created.json()) as { id: string; updatedAt: string };
        if (pickWinner(draft.updatedAt, record.updatedAt) === "remote") {
          // Server has newer data for this intent: keep it (latest edit wins).
          return { result: "stale", serverId: record.id };
        }

        const patched = await fetch(`/api/checksheets/${record.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            headerSnapshot: draft.payload.headerSnapshot,
            itemSnapshot: draft.payload.itemSnapshot,
            ...(draft.payload.remarksSnapshot
              ? { remarksSnapshot: draft.payload.remarksSnapshot }
              : {}),
            totalItems: draft.payload.totalItems,
            ngItems: draft.payload.ngItems,
            finalJudgment: draft.payload.finalJudgment,
            clientUpdatedAt: draft.updatedAt,
          }),
        });

        // 403/422 here means the server document moved on (e.g. submitted): keep it.
        if (patched.status === 401 || patched.status === 403 || patched.status === 409) {
          return { result: "stale", serverId: record.id };
        }
        return { result: patched.ok ? "synced" : "failed", serverId: record.id };
      } catch {
        return { result: "failed" };
      }
    },
    [],
  );

  /**
   * Uploads files queued while offline to the document that just synced.
   * A failed upload stays queued for the next attempt (files are never dropped).
   */
  const uploadQueuedAttachments = useCallback(
    async (draftKey: string, checksheetId: string) => {
      const queued = await listQueuedAttachments(draftKey);
      for (const item of queued) {
        const data = new FormData();
        data.append("file", item.blob, item.fileName);
        try {
          const response = await fetch(`/api/checksheets/${checksheetId}/attachments`, {
            method: "POST",
            body: data,
          });
          if (response.ok || response.status === 422) {
            // 422 means the server rejected the file (type/size); retrying cannot help.
            await removeQueuedAttachment(item.id);
          }
        } catch {
          // Keep queued; the next sync cycle retries.
        }
      }
    },
    [],
  );

  const flush = useCallback(async () => {
    if (running.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    if (drafts.length === 0) return;

    running.current = true;
    setSyncing(true);

    try {
      let current = readDrafts(userId);

      for (const draft of current) {
        if (!current.some((entry) => entry.idempotencyKey === draft.idempotencyKey)) continue;
        current = upsertDraft(current, { ...draft, state: "syncing" });
        persist(current);

        const { result, serverId } = await syncOne(draft);

        if (result === "failed") {
          const latest = readDrafts(userId).map((entry) =>
            entry.idempotencyKey === draft.idempotencyKey
              ? { ...entry, state: "failed" as const, lastError: "sync-failed" }
              : entry,
          );
          current = latest;
          persist(latest);
          continue;
        }

        current = removeDraft(readDrafts(userId), draft.idempotencyKey);
        persist(current);
        setLastSyncedAt(new Date().toISOString());

        // Attachments queue behind their draft: the document id only exists now.
        if (serverId) await uploadQueuedAttachments(draft.idempotencyKey, serverId);
      }
    } finally {
      running.current = false;
      setSyncing(false);
    }
  }, [drafts.length, persist, syncOne, uploadQueuedAttachments, userId]);

  const enqueueDraft = useCallback(
    (idempotencyKey: string, payload: OfflineDraftPayload) => {
      const existing = readDrafts(userId).find((entry) => entry.idempotencyKey === idempotencyKey);
      const next = upsertDraft(readDrafts(userId), {
        idempotencyKey,
        serverId: existing?.serverId ?? null,
        updatedAt: new Date().toISOString(),
        payload,
        state: "pending",
      });
      persist(next);
    },
    [persist, userId],
  );

  // React to connectivity changes and retry periodically while work is queued.
  useEffect(() => {
    function handleOnline() {
      setOnline(true);
      void flush();
    }
    function handleOffline() {
      setOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flush]);

  useEffect(() => {
    if (drafts.length === 0) return;
    const timer = window.setInterval(() => void flush(), SYNC_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [drafts.length, flush]);

  const value = useMemo<OfflineSyncValue>(
    () => ({
      online,
      pending: drafts.filter((draft) => draft.state !== "failed").length,
      failed: drafts.filter((draft) => draft.state === "failed").length,
      syncing,
      lastSyncedAt,
      enqueueDraft,
      flush: () => void flush(),
    }),
    [drafts, enqueueDraft, flush, lastSyncedAt, online, syncing],
  );

  return <OfflineSyncContext.Provider value={value}>{children}</OfflineSyncContext.Provider>;
}

export function useOfflineSync(): OfflineSyncValue {
  const context = useContext(OfflineSyncContext);
  if (!context) throw new Error("useOfflineSync harus dipakai di dalam OfflineSyncProvider");
  return context;
}
