import { describe, expect, it } from "vitest";
import {
  parseDrafts,
  pickWinner,
  removeDraft,
  storageKey,
  upsertDraft,
  type OfflineDraft,
} from "@/lib/offline/drafts";

function draft(overrides: Partial<OfflineDraft> = {}): OfflineDraft {
  return {
    idempotencyKey: "key-1",
    serverId: null,
    updatedAt: "2026-11-17T10:00:00.000Z",
    payload: {
      formCode: "CS-01",
      formName: "Incoming Material COLLAR",
      templateRevision: "00",
      partNo: "7145-0040-0w",
      partName: "COLLAR",
      lotNo: "LOT-1",
      inspectionDate: "2026-11-17",
      headerSnapshot: { lotNo: "LOT-1" },
      itemSnapshot: { "flat:0:0": "OK" },
      totalItems: 1,
      ngItems: 0,
      finalJudgment: "OK",
    },
    state: "pending",
    ...overrides,
  };
}

describe("offline draft store", () => {
  it("uses a per-user storage key so shared devices do not leak drafts", () => {
    expect(storageKey("user-a")).not.toBe(storageKey("user-b"));
    expect(storageKey("user-a")).toContain("user-a");
  });

  it("keeps the newest edit when the local copy is newer", () => {
    expect(pickWinner("2026-11-17T12:00:00.000Z", "2026-11-17T11:00:00.000Z")).toBe("local");
  });

  it("defers to the server when the server copy is newer", () => {
    expect(pickWinner("2026-11-17T11:00:00.000Z", "2026-11-17T12:00:00.000Z")).toBe("remote");
  });

  it("prefers the server on equal timestamps (no needless overwrite)", () => {
    expect(pickWinner("2026-11-17T12:00:00.000Z", "2026-11-17T12:00:00.000Z")).toBe("remote");
  });

  it("treats an unparseable local timestamp as stale", () => {
    expect(pickWinner("not-a-date", "2026-11-17T12:00:00.000Z")).toBe("remote");
  });

  it("replaces an existing draft with the same idempotency key", () => {
    const first = draft();
    const second = draft({ updatedAt: "2026-11-17T13:00:00.000Z", state: "failed" });
    const result = upsertDraft(upsertDraft([], first), second);

    expect(result).toHaveLength(1);
    expect(result[0]?.updatedAt).toBe("2026-11-17T13:00:00.000Z");
    expect(result[0]?.state).toBe("failed");
  });

  it("keeps separate drafts for different intents and sorts oldest first", () => {
    const a = draft({ idempotencyKey: "key-a", updatedAt: "2026-11-17T12:00:00.000Z" });
    const b = draft({ idempotencyKey: "key-b", updatedAt: "2026-11-17T10:00:00.000Z" });
    const result = upsertDraft(upsertDraft([], a), b);

    expect(result.map((entry) => entry.idempotencyKey)).toEqual(["key-b", "key-a"]);
  });

  it("removes a synced draft by key", () => {
    const result = removeDraft([draft(), draft({ idempotencyKey: "key-2" })], "key-1");
    expect(result.map((entry) => entry.idempotencyKey)).toEqual(["key-2"]);
  });

  it("ignores corrupted or malformed stored drafts", () => {
    expect(parseDrafts(null)).toEqual([]);
    expect(parseDrafts("not json")).toEqual([]);
    expect(parseDrafts('{"not":"an array"}')).toEqual([]);
    expect(parseDrafts('[{"idempotencyKey":1}]')).toEqual([]);
    expect(parseDrafts('[{"idempotencyKey":"k","updatedAt":"x","payload":{}}]')).toEqual([]);
  });

  it("restores a valid stored draft", () => {
    const restored = parseDrafts(JSON.stringify([draft()]));
    expect(restored).toHaveLength(1);
    expect(restored[0]?.payload.lotNo).toBe("LOT-1");
    expect(restored[0]?.state).toBe("pending");
  });

  it("normalizes unknown states to pending rather than trusting storage", () => {
    const raw = JSON.stringify([draft({ state: "weird" as never })]);
    expect(parseDrafts(raw)[0]?.state).toBe("pending");
  });
});
