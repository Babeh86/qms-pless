import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";

export interface StoredAttachmentView {
  id: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

/**
 * Read-only attachment list for a persisted check sheet. Download links point at
 * the authorized API which issues a short-lived signed URL from object storage.
 */
export function StoredAttachments({
  checksheetId,
  items,
  labels,
}: {
  checksheetId: string;
  items: StoredAttachmentView[];
  labels: { title: string; empty: string; download: string };
}) {
  return (
    <Card className="border-slate-200/80">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[13px] font-bold text-slate-800">{labels.title}</h2>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {items.length}
          </span>
        </div>

        {items.length === 0 ? (
          <p className="text-[11px] text-slate-400">{labels.empty}</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white p-2"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-100 text-slate-500">
                  <FileText className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-[10px] font-semibold text-slate-700"
                    title={item.originalName}
                  >
                    {item.originalName}
                  </span>
                  <span className="block text-[9px] text-slate-400">
                    {formatSize(item.sizeBytes)} · {item.contentType}
                  </span>
                </span>
                <a
                  href={`/api/checksheets/${checksheetId}/attachments/${item.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${labels.download}: ${item.originalName}`}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
