"use client";

/**
 * Offline draft store.
 *
 * Drafts are keyed by the same idempotency key used by the server, so repeated
 * sync attempts can never create duplicate documents. Conflict resolution is
 * "latest edit wins": compare `updatedAt` and adopt whichever side is newer.
 */

export interface OfflineDraftPayload {
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

export type OfflineDraftState = "pending" | "syncing" | "failed";

export interface OfflineDraft {
  idempotencyKey: string;
  serverId: string | null;
  /** ISO timestamp of the last local edit. */
  updatedAt: string;
  payload: OfflineDraftPayload;
  state: OfflineDraftState;
  lastError?: string;
}

const STORAGE_PREFIX = "qms.offline.drafts.";

export function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

/** Latest edit wins. Equal timestamps keep the server copy (no needless write). */
export function pickWinner(
  localUpdatedAt: string,
  remoteUpdatedAt: string,
): "local" | "remote" {
  const local = Date.parse(localUpdatedAt);
  const remote = Date.parse(remoteUpdatedAt);
  if (Number.isNaN(local)) return "remote";
  if (Number.isNaN(remote)) return "local";
  return local > remote ? "local" : "remote";
}

/** Insert or replace a draft, keeping the queue ordered oldest-first. */
export function upsertDraft(drafts: OfflineDraft[], draft: OfflineDraft): OfflineDraft[] {
  const next = drafts.filter((entry) => entry.idempotencyKey !== draft.idempotencyKey);
  next.push(draft);
  return next.sort((a, b) => Date.parse(a.updatedAt) - Date.parse(b.updatedAt));
}

export function removeDraft(drafts: OfflineDraft[], idempotencyKey: string): OfflineDraft[] {
  return drafts.filter((entry) => entry.idempotencyKey !== idempotencyKey);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Storage is untrusted (older versions, manual edits, other tabs). Parse strictly
 * and drop anything that does not match the expected shape.
 */
export function parseDrafts(raw: string | null): OfflineDraft[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const drafts: OfflineDraft[] = [];
  for (const entry of parsed) {
    if (!isRecord(entry)) continue;
    const payload = entry.payload;
    if (!isRecord(payload)) continue;
    if (
      typeof entry.idempotencyKey !== "string" ||
      typeof entry.updatedAt !== "string" ||
      typeof payload.formCode !== "string" ||
      typeof payload.lotNo !== "string" ||
      !isRecord(payload.headerSnapshot) ||
      !isRecord(payload.itemSnapshot)
    ) {
      continue;
    }
    drafts.push({
      idempotencyKey: entry.idempotencyKey,
      serverId: typeof entry.serverId === "string" ? entry.serverId : null,
      updatedAt: entry.updatedAt,
      payload: payload as unknown as OfflineDraftPayload,
      state: entry.state === "failed" ? "failed" : "pending",
      ...(typeof entry.lastError === "string" ? { lastError: entry.lastError } : {}),
    });
  }
  return drafts;
}

export function readDrafts(userId: string): OfflineDraft[] {
  if (typeof window === "undefined") return [];
  try {
    return parseDrafts(window.localStorage.getItem(storageKey(userId)));
  } catch {
    return [];
  }
}

export function writeDrafts(userId: string, drafts: OfflineDraft[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(drafts));
  } catch {
    // Quota or private mode: the draft stays in memory for this session only.
  }
}

export function clearDrafts(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(storageKey(userId));
  } catch {
    // ignore
  }
}
