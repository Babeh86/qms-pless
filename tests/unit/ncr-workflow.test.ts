import { describe, expect, it } from "vitest";
import {
  isNcrOverdue,
  ncrAllowedActions,
  ncrMissingFields,
  ncrNextStatus,
  ncrRequiresNote,
} from "@/lib/ncr-workflow";

describe("NCR / CAPA workflow", () => {
  it("walks the controlled lifecycle in order", () => {
    expect(ncrAllowedActions("OPEN")).toContain("CONTAIN");
    expect(ncrAllowedActions("CONTAINED")).toContain("PLAN_ACTION");
    expect(ncrAllowedActions("IN_ACTION")).toContain("VERIFY");
    expect(ncrAllowedActions("VERIFIED")).toContain("CLOSE");
    expect(ncrAllowedActions("CLOSED")).toEqual(["REOPEN"]);
    expect(ncrAllowedActions("CANCELLED")).toEqual([]);
  });

  it("does not allow skipping containment straight to close", () => {
    expect(ncrAllowedActions("OPEN")).not.toContain("CLOSE");
    expect(ncrAllowedActions("CONTAINED")).not.toContain("CLOSE");
    expect(ncrAllowedActions("IN_ACTION")).not.toContain("CLOSE");
  });

  it("maps each transition to its resulting status", () => {
    expect(ncrNextStatus("CONTAIN")).toBe("CONTAINED");
    expect(ncrNextStatus("PLAN_ACTION")).toBe("IN_ACTION");
    expect(ncrNextStatus("VERIFY")).toBe("VERIFIED");
    expect(ncrNextStatus("CLOSE")).toBe("CLOSED");
    expect(ncrNextStatus("REOPEN")).toBe("OPEN");
    expect(ncrNextStatus("CANCEL")).toBe("CANCELLED");
  });

  it("requires notes for reopen/cancel/plan/verify", () => {
    expect(ncrRequiresNote("REOPEN")).toBe(true);
    expect(ncrRequiresNote("CANCEL")).toBe(true);
    expect(ncrRequiresNote("PLAN_ACTION")).toBe(true);
    expect(ncrRequiresNote("VERIFY")).toBe(true);
    expect(ncrRequiresNote("CONTAIN")).toBe(false);
    expect(ncrRequiresNote("CLOSE")).toBe(false);
  });

  it("requires containment before containing", () => {
    expect(ncrMissingFields("CONTAIN", {}, {})).toEqual(["containment"]);
    expect(ncrMissingFields("CONTAIN", {}, { containment: "Sortir 100%" })).toEqual([]);
  });

  it("requires root cause and corrective action to plan CAPA", () => {
    expect(ncrMissingFields("PLAN_ACTION", {}, {})).toEqual(["rootCause", "correctiveAction"]);
    expect(
      ncrMissingFields("PLAN_ACTION", {}, { rootCause: "Suhu barrel tinggi", correctiveAction: "Kalibrasi" }),
    ).toEqual([]);
  });

  it("accepts fields already stored on the record", () => {
    expect(
      ncrMissingFields("VERIFY", { verification: "Uji ulang 30 pcs OK" }, {}),
    ).toEqual([]);
  });

  it("detects overdue targets", () => {
    const now = new Date("2026-11-17T00:00:00Z");
    expect(isNcrOverdue(new Date("2026-11-10T00:00:00Z"), now)).toBe(true);
    expect(isNcrOverdue(new Date("2026-11-20T00:00:00Z"), now)).toBe(false);
    expect(isNcrOverdue(null, now)).toBe(false);
  });
});
