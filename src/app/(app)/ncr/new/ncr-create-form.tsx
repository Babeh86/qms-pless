"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface NcrCreateInitial {
  checksheetId: string;
  checksheetItemKey: string;
  partNo: string;
  partName: string;
  lotNo: string;
}

export function NcrCreateForm({
  initial,
  labels,
}: {
  initial: NcrCreateInitial;
  labels: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    defectType: "",
    defectLocation: "",
    severity: "MAJOR",
    description: "",
    containment: "",
    picName: "",
    targetDate: "",
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.defectType.trim() === "" || form.description.trim().length < 5) {
      setError(labels.required ?? "Required fields missing");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/ncr", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(initial.checksheetId ? { checksheetId: initial.checksheetId } : {}),
          ...(initial.checksheetItemKey ? { checksheetItemKey: initial.checksheetItemKey } : {}),
          partNo: initial.partNo,
          partName: initial.partName,
          lotNo: initial.lotNo,
          defectType: form.defectType,
          ...(form.defectLocation ? { defectLocation: form.defectLocation } : {}),
          severity: form.severity,
          description: form.description,
          ...(form.containment ? { containment: form.containment } : {}),
          ...(form.picName ? { picName: form.picName } : {}),
          ...(form.targetDate ? { targetDate: form.targetDate } : {}),
        }),
      });

      if (response.status === 201) {
        const created: { id: string } = await response.json();
        router.push(`/ncr/${created.id}`);
        router.refresh();
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { error?: { code?: string } }
        | null;
      setError(
        payload?.error?.code === "VALIDATION"
          ? (labels.required ?? "Invalid data")
          : (labels.failed ?? "Failed"),
      );
    } catch {
      setError(labels.failed ?? "Failed");
    } finally {
      setPending(false);
    }
  }

  const textField = (
    key: keyof typeof form,
    label: string,
    options: { textarea?: boolean; type?: string } = {},
  ) => (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold text-slate-600">{label}</span>
      {options.textarea ? (
        <textarea
          rows={3}
          value={form[key]}
          onChange={(event) => set(key, event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-400"
        />
      ) : (
        <input
          type={options.type ?? "text"}
          value={form[key]}
          onChange={(event) => set(key, event.target.value)}
          className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
        />
      )}
    </label>
  );

  return (
    <form onSubmit={submit}>
      <Card className="border-slate-200/80">
        <CardContent className="space-y-3">
          <div className="grid gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:grid-cols-3">
            <div>
              <p className="text-[9px] text-slate-400">{labels.partNo}</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-700">{initial.partNo || "—"}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400">{labels.partName}</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-700">{initial.partName || "—"}</p>
            </div>
            <div>
              <p className="text-[9px] text-slate-400">{labels.lotNo}</p>
              <p className="mt-1 text-[11px] font-semibold text-slate-700">{initial.lotNo || "—"}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {textField("defectType", `${labels.defectType ?? "Defect"} *`)}
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold text-slate-600">
                {labels.severity}
              </span>
              <select
                value={form.severity}
                onChange={(event) => set("severity", event.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-blue-400"
              >
                <option value="MINOR">{labels.MINOR}</option>
                <option value="MAJOR">{labels.MAJOR}</option>
                <option value="CRITICAL">{labels.CRITICAL}</option>
              </select>
            </label>
            {textField("defectLocation", labels.defectLocation ?? "Location")}
            {textField("picName", labels.pic ?? "PIC")}
          </div>

          {textField("description", `${labels.description ?? "Description"} *`, { textarea: true })}
          {textField("containment", labels.containment ?? "Containment", { textarea: true })}

          <label className="block sm:w-56">
            <span className="mb-1 block text-[10px] font-semibold text-slate-600">
              {labels.target}
            </span>
            <input
              type="date"
              value={form.targetDate}
              onChange={(event) => set("targetDate", event.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 px-2 text-[11px] outline-none focus:border-blue-400"
            />
          </label>

          {error ? (
            <p role="alert" className="text-[11px] font-medium text-danger-600">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <Button type="button" variant="outline" size="md" onClick={() => router.back()}>
              {labels.cancel}
            </Button>
            <Button type="submit" size="md" disabled={pending}>
              {pending ? labels.saving : labels.save}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
