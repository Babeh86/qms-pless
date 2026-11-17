"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface DecisionView {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  comment: string | null;
  at: string;
}

export interface WorkflowPanelProps {
  checksheetId: string;
  status: string;
  actions: string[];
  decisions: DecisionView[];
  labels: Record<string, string | undefined>;
}

const REQUIRES_COMMENT = new Set(["REJECT", "RETURN"]);

export function WorkflowPanel({
  checksheetId,
  status,
  actions,
  decisions,
  labels,
}: WorkflowPanelProps) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: string) {
    if (REQUIRES_COMMENT.has(action) && comment.trim() === "") {
      setError(labels.commentRequired ?? "Comment required");
      return;
    }
    setPending(action);
    setError(null);
    try {
      const response = await fetch(`/api/checksheets/${checksheetId}/decisions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...(comment.trim() ? { comment: comment.trim() } : {}) }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { code?: string } }
          | null;
        setError(
          response.status === 409
            ? (labels.staleStatus ?? "Status changed")
            : response.status === 403
              ? (labels.forbidden ?? "Forbidden")
              : response.status === 422
                ? payload?.error?.code === "VALIDATION"
                  ? (labels.incomplete ?? labels.validation ?? "Incomplete")
                  : (labels.validation ?? "Invalid")
                : (labels.failed ?? "Failed"),
        );
        return;
      }
      setComment("");
      router.refresh();
    } catch {
      setError(labels.failed ?? "Failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <Card className="border-slate-200/80">
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
        <Badge tone={statusTone(status as never)} dot>
          {status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.length === 0 ? (
          <p className="text-[11px] text-ink-500">{labels.noActions}</p>
        ) : (
          <div className="space-y-2">
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold text-slate-600">
                {labels.comment}
              </span>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={2}
                placeholder={labels.commentPlaceholder}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-400"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <Button
                  key={action}
                  size="sm"
                  variant={
                    action === "REJECT" || action === "RETURN"
                      ? "outline"
                      : action === "APPROVE" || action === "CHECK"
                        ? "success"
                        : "primary"
                  }
                  disabled={pending !== null}
                  onClick={() => void run(action)}
                >
                  {labels[action] ?? action}
                </Button>
              ))}
            </div>
            {error ? (
              <p role="alert" className="text-[11px] font-medium text-danger-600">
                {error}
              </p>
            ) : null}
          </div>
        )}

        <div>
          <h3 className="mb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            {labels.history}
          </h3>
          {decisions.length === 0 ? (
            <p className="text-[11px] text-ink-400">{labels.noHistory}</p>
          ) : (
            <ol className="space-y-2">
              {decisions.map((decision) => (
                <li
                  key={decision.id}
                  className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">{decision.action}</Badge>
                    <span className="text-[10px] font-semibold text-slate-700">
                      {decision.actorName}
                    </span>
                    <span className="text-[9px] text-slate-400">{decision.actorRole}</span>
                    <span className="ml-auto font-mono text-[9px] text-slate-400">
                      {new Date(decision.at).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <p className="mt-1 text-[9px] text-slate-500">
                    {decision.fromStatus} → {decision.toStatus}
                  </p>
                  {decision.comment ? (
                    <p className="mt-1 text-[10px] text-slate-600">{decision.comment}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
