import type { ChecksheetStatus } from "@prisma/client";

/**
 * Single source of truth for the check sheet approval workflow.
 *
 * INSPECTOR: DRAFT/REJECTED --SUBMIT--> SUBMITTED
 * CHECKED:   SUBMITTED       --CHECK-->  CHECKED   (or REJECT/RETURN)
 * APPROVED:  CHECKED         --APPROVE-> APPROVED  (or REJECT/RETURN)
 *
 * Approval is final; rejected sheets may be revised and resubmitted so the full
 * decision history is preserved.
 */

export type TransitionAction = "SUBMIT" | "CHECK" | "APPROVE" | "REJECT" | "RETURN";

export type WorkflowRole = "INSPECTOR" | "CHECKED" | "APPROVED" | "ADMIN" | "MD_ADMIN" | "VIEWER";

const REQUIRES_COMMENT: ReadonlySet<TransitionAction> = new Set(["REJECT", "RETURN"]);

export function requiresComment(action: TransitionAction): boolean {
  return REQUIRES_COMMENT.has(action);
}

export function nextStatusFor(action: TransitionAction): ChecksheetStatus {
  switch (action) {
    case "SUBMIT":
      return "SUBMITTED";
    case "CHECK":
      return "CHECKED";
    case "APPROVE":
      return "APPROVED";
    case "REJECT":
      return "REJECTED";
    case "RETURN":
      return "DRAFT";
  }
}

export function allowedActions(role: WorkflowRole, status: ChecksheetStatus): TransitionAction[] {
  if (role === "ADMIN") return [];
  if (role === "VIEWER" || role === "MD_ADMIN") return [];

  if (role === "INSPECTOR") {
    return status === "DRAFT" || status === "REJECTED" ? ["SUBMIT"] : [];
  }

  if (role === "CHECKED") {
    return status === "SUBMITTED" ? ["CHECK", "REJECT", "RETURN"] : [];
  }

  if (role === "APPROVED") {
    return status === "CHECKED" ? ["APPROVE", "REJECT", "RETURN"] : [];
  }

  return [];
}

export interface CompletenessInput {
  headerMissing: number;
  requiredItems: number;
  filledItems: number;
}

/** Server-side submit rule: the header and every required item must be filled. */
export function canSubmitCompletely(input: CompletenessInput): boolean {
  return (
    input.headerMissing === 0 &&
    input.requiredItems > 0 &&
    input.filledItems >= input.requiredItems
  );
}
