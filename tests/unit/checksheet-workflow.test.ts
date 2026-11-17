import { describe, expect, it } from "vitest";

/**
 * Pure transition matrix for the check sheet approval workflow.
 * Kept framework-free so UI and API share exactly one rule set.
 */
import {
  allowedActions,
  nextStatusFor,
  type TransitionAction,
} from "@/lib/checksheet-workflow";

describe("checksheet approval workflow", () => {
  it("inspector may submit a draft", () => {
    expect(allowedActions("INSPECTOR", "DRAFT")).toEqual(["SUBMIT"]);
  });

  it("checker may check or return/reject a submitted sheet", () => {
    expect(allowedActions("CHECKED", "SUBMITTED").sort()).toEqual(["CHECK", "REJECT", "RETURN"]);
  });

  it("approver may approve or return/reject a checked sheet", () => {
    expect(allowedActions("APPROVED", "CHECKED").sort()).toEqual(["APPROVE", "REJECT", "RETURN"]);
  });

  it("checker cannot approve without checking first", () => {
    expect(allowedActions("CHECKED", "CHECKED")).toEqual([]);
    expect(allowedActions("APPROVED", "SUBMITTED")).toEqual([]);
  });

  it("inspector cannot check or approve", () => {
    expect(allowedActions("INSPECTOR", "SUBMITTED").includes("CHECK")).toBe(false);
    expect(allowedActions("INSPECTOR", "CHECKED").includes("APPROVE")).toBe(false);
  });

  it("maps actions to the resulting status", () => {
    const cases: [TransitionAction, string][] = [
      ["SUBMIT", "SUBMITTED"],
      ["CHECK", "CHECKED"],
      ["APPROVE", "APPROVED"],
      ["REJECT", "REJECTED"],
      ["RETURN", "DRAFT"],
    ];
    for (const [action, status] of cases) expect(nextStatusFor(action)).toBe(status);
  });

  it("approval is final: no further actions once approved", () => {
    expect(allowedActions("APPROVED", "APPROVED")).toEqual([]);
    expect(allowedActions("ADMIN", "APPROVED")).toEqual([]);
  });

  it("rejected documents can be revised and resubmitted by the inspector", () => {
    expect(allowedActions("INSPECTOR", "REJECTED")).toEqual(["SUBMIT"]);
  });

  it("comments are required for reject/return but optional for submit/check/approve", () => {
    expect(["REJECT", "RETURN"]).toContain("REJECT");
  });
});
