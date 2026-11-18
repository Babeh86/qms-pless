import type { NcrStatus } from "@prisma/client";

/**
 * NCR / CAPA lifecycle.
 *
 * OPEN --CONTAIN--> CONTAINED --PLAN_ACTION--> IN_ACTION --VERIFY--> VERIFIED --CLOSE--> CLOSED
 *
 * REOPEN (CLOSED -> OPEN) and CANCEL (any active state) require a note.
 * One record carries both the non-conformance and its corrective actions so the
 * register and CAPA tracking never diverge.
 */

export type NcrTransition = "CONTAIN" | "PLAN_ACTION" | "VERIFY" | "CLOSE" | "REOPEN" | "CANCEL";

const NOTE_REQUIRED: ReadonlySet<NcrTransition> = new Set([
  "REOPEN",
  "CANCEL",
  "PLAN_ACTION",
  "VERIFY",
]);

export function ncrRequiresNote(action: NcrTransition): boolean {
  return NOTE_REQUIRED.has(action);
}

export function ncrNextStatus(action: NcrTransition): NcrStatus {
  switch (action) {
    case "CONTAIN":
      return "CONTAINED";
    case "PLAN_ACTION":
      return "IN_ACTION";
    case "VERIFY":
      return "VERIFIED";
    case "CLOSE":
      return "CLOSED";
    case "REOPEN":
      return "OPEN";
    case "CANCEL":
      return "CANCELLED";
  }
}

const ACTIVE_STATES: readonly NcrStatus[] = ["OPEN", "CONTAINED", "IN_ACTION", "VERIFIED"];

export function ncrAllowedActions(status: NcrStatus): NcrTransition[] {
  if (status === "CANCELLED") return [];
  if (status === "CLOSED") return ["REOPEN"];
  const actions: NcrTransition[] = [];
  if (status === "OPEN") actions.push("CONTAIN");
  if (status === "CONTAINED") actions.push("PLAN_ACTION");
  if (status === "IN_ACTION") actions.push("VERIFY");
  if (status === "VERIFIED") actions.push("CLOSE");
  if (ACTIVE_STATES.includes(status)) actions.push("CANCEL");
  return actions;
}

export interface NcrActionInput {
  containment?: string;
  rootCause?: string;
  correctiveAction?: string;
  preventiveAction?: string;
  verification?: string;
}

/**
 * Fields required before a transition may proceed. Enforced server-side so a
 * CAPA cannot be "closed" with empty evidence.
 */
export function ncrMissingFields(
  action: NcrTransition,
  existing: NcrActionInput,
  incoming: NcrActionInput,
): string[] {
  const merged = { ...existing, ...incoming };
  const filled = (value?: string) => (value ?? "").trim() !== "";

  if (action === "CONTAIN") return filled(merged.containment) ? [] : ["containment"];
  if (action === "PLAN_ACTION") {
    const missing: string[] = [];
    if (!filled(merged.rootCause)) missing.push("rootCause");
    if (!filled(merged.correctiveAction)) missing.push("correctiveAction");
    return missing;
  }
  if (action === "VERIFY") return filled(merged.verification) ? [] : ["verification"];
  return [];
}

export function isNcrOverdue(targetDate: Date | null | undefined, now: Date): boolean {
  if (!targetDate) return false;
  return targetDate.getTime() < now.getTime();
}
