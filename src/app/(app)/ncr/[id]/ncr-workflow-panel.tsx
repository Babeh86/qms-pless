"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, judgmentTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ncrAllowedActions } from "@/lib/ncr-workflow";
import type { NcrStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface NcrEventView {
  id: string;
  action: string;
  actorName: string;
  actorRole: string;
  fromStatus: string;
  toStatus: string;
  note: string | null;
  at: string;
}

export function NcrWorkflowPanel({
  ncrId,
  status,
  actions,
  events,
  labels,
}: {
  ncrId: string;
  status: string;
  actions: string[];
  events: NcrEventView[];
  labels: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    note: "",
    containment: "",
    rootCause: "",
    correctiveAction: "",
    preventiveAction: "",
    verification: "",
    picName: "",
    targetDate: "",
  });
  const [pending, setPending] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>(status);
  const [liveEvents, setLiveEvents] = useState(events);
  const [liveActions, setLiveActions] = useState<string[]>(actions);
  const [error, setError] = useState<string | null>(null);

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((current) => ({ ...current, [key]: event.target.value })),
    };
  }

  async function run(action: string) {
    setPending(action);
    setError(null);
    try {
      const response = await fetch(`/api/ncr/${ncrId}/transitions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          ...Object.fromEntries(Object.entries(form).filter(([, value]) => value.trim() !== "")),
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { code?: string } }
          | null;
        setError(
          response.status === 409
            ? (labels.stale ?? "Status changed")
            : payload?.error?.code === "VALIDATION"
              ? (labels.incomplete ?? "Incomplete or invalid data")
              : (labels.failed ?? "Failed"),
        );
        return;
      }
      const updated = (await response.json()) as { status: string };
      setCurrentStatus(updated.status);
      setLiveActions(ncrAllowedActions(updated.status as NcrStatus));
      setLiveEvents((current) => [
        ...current,
        {
          id: `local-${Date.now()}`,
          action,
          actorName: "Anda",
          actorRole: "—",
          fromStatus: currentStatus,
          toStatus: updated.status,
          note: form.note || null,
          at: new Date().toISOString(),
        },
      ]);
      setForm({
        note: "",
        containment: "",
        rootCause: "",
        correctiveAction: "",
        preventiveAction: "",
        verification: "",
        picName: "",
        targetDate: "",
      });
      router.refresh();
    } catch {
      setError(labels.failed ?? "Failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
      <Card className="border-slate-200/80">
        <CardHeader>
          <CardTitle>{labels.capaTitle ?? "CAPA"}</CardTitle>
          <Badge tone={judgmentTone(currentStatus === "CLOSED" ? "OK" : null)}>{currentStatus}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold text-slate-600">
                {labels.pic ?? "PIC"}
              </span>
              <input
                {...field("picName")}
                className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold text-slate-600">
                {labels.target ?? "Target"}
              </span>
              <input
                type="date"
                {...field("targetDate")}
                className="h-9 w-full rounded-lg border border-slate-200 px-2 text-[11px] outline-none focus:border-blue-400"
              />
            </label>
          </div>

          {[
            { key: "containment" as const, label: labels.containment ?? "Containment" },
            { key: "rootCause" as const, label: labels.rootCause ?? "Root cause" },
            { key: "correctiveAction" as const, label: labels.corrective ?? "Corrective action" },
            { key: "preventiveAction" as const, label: labels.preventive ?? "Preventive action" },
            { key: "verification" as const, label: labels.verification ?? "Verification" },
          ].map((item) => (
            <label key={item.key} className="block">
              <span className="mb-1 block text-[10px] font-semibold text-slate-600">{item.label}</span>
              <textarea
                rows={2}
                {...field(item.key)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-400"
              />
            </label>
          ))}

          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold text-slate-600">
              {labels.note ?? "Note"}
            </span>
            <textarea
              rows={2}
              {...field("note")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-400"
            />
          </label>

          {liveActions.length === 0 ? (
            <p className="text-[11px] text-ink-500">{labels.noActions ?? "No actions available."}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {liveActions.map((action) => (
                <Button
                  key={action}
                  size="sm"
                  variant={action === "CANCEL" ? "outline" : action === "CLOSE" ? "success" : "primary"}
                  disabled={pending !== null}
                  onClick={() => void run(action)}
                >
                  {labels[action] ?? action}
                </Button>
              ))}
            </div>
          )}

          {error ? (
            <p role="alert" className="text-[11px] font-medium text-danger-600">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-slate-200/80">
        <CardHeader>
          <CardTitle>{labels.history ?? "History"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {liveEvents.map((event) => (
              <li key={event.id} className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">{event.action}</Badge>
                  <span className="text-[10px] font-semibold text-slate-700">{event.actorName}</span>
                  <span className="text-[9px] text-slate-400">{event.actorRole}</span>
                  <span className="ml-auto font-mono text-[9px] text-slate-400">
                    {new Date(event.at).toLocaleString("id-ID")}
                  </span>
                </div>
                <p className="mt-1 text-[9px] text-slate-500">
                  {event.fromStatus} → {event.toStatus}
                </p>
                {event.note ? <p className="mt-1 text-[10px] text-slate-600">{event.note}</p> : null}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
