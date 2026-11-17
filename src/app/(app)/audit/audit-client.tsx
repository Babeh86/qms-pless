"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ScrollText, LogIn, LogOut, ShieldAlert, Search, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, PageHeader, TableWrap, Td, Th, Tr } from "@/components/ui/page-header";
import { Pagination, SearchInput, Toolbar } from "@/components/ui/toolbar";

export interface AuditEntry {
  id: string;
  at: string;
  actorName: string;
  action: string;
  entity: string;
  summary: string;
  ip: string;
}

const ACTION_META: Record<string, { tone: "brand" | "success" | "danger" | "warning" | "violet"; icon: typeof LogIn }> = {
  LOGIN_SUCCESS: { tone: "success", icon: LogIn },
  LOGIN_FAILED: { tone: "danger", icon: ShieldAlert },
  LOGOUT: { tone: "neutral" as never, icon: LogOut },
  CREATE: { tone: "brand", icon: ScrollText },
  UPDATE: { tone: "warning", icon: ScrollText },
  DELETE: { tone: "danger", icon: ScrollText },
  APPROVE: { tone: "success", icon: ScrollText },
  REJECT: { tone: "danger", icon: ScrollText },
  IMPORT: { tone: "violet", icon: ScrollText },
};

const PAGE_SIZE = 12;

export function AuditClient({ entries }: { entries: AuditEntry[] }) {
  const t = useTranslations("audit");
  const tLit = useTranslations("lit");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.actorName.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.entity.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q),
    );
  }, [entries, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button variant="outline" size="md" iconLeft={<Download className="h-3.5 w-3.5" />}>
            {tLit("export")}
          </Button>
        }
      />

      <Toolbar>
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Cari pelaku, aksi, atau entitas…"
          className="w-full sm:w-80"
        />
        <div className="ml-auto flex items-center gap-2">
          <Badge tone="brand">
            {t("total", { total: filtered.length })}
          </Badge>
          <Badge tone="success" dot>
            {tLit("appendOnly")}
          </Badge>
        </div>
      </Toolbar>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <EmptyState
              title={tLit("noLog")}
              icon={<Search className="h-5 w-5" />}
            />
          ) : (
            <>
              <TableWrap>
                <thead>
                  <tr>
                    <Th className="w-40">{t("columns.at")}</Th>
                    <Th className="w-44">{t("columns.actor")}</Th>
                    <Th className="w-36">{t("columns.action")}</Th>
                    <Th className="w-28">{t("columns.entity")}</Th>
                    <Th>{t("columns.summary")}</Th>
                    <Th className="w-28">{t("columns.ip")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e) => {
                    const meta = ACTION_META[e.action];
                    const Icon = meta?.icon ?? ScrollText;

                    return (
                      <Tr key={e.id}>
                        <Td>
                          <span className="text-[11px] whitespace-nowrap text-ink-600 tabular">
                            {e.at}
                          </span>
                        </Td>
                        <Td>
                          <span className="text-xs font-medium text-ink-900">{e.actorName}</span>
                        </Td>
                        <Td>
                          <span className="inline-flex items-center gap-1.5 rounded-md bg-ink-100 px-2 py-0.5 text-[10px] font-bold text-ink-700">
                            <Icon className="h-2.5 w-2.5" aria-hidden="true" />
                            {e.action}
                          </span>
                        </Td>
                        <Td>
                          <span className="text-[11px] text-ink-600">{e.entity}</span>
                        </Td>
                        <Td>
                          <span className="text-xs text-ink-700">{e.summary}</span>
                        </Td>
                        <Td>
                          <code className="text-[10px] text-ink-400">{e.ip}</code>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </TableWrap>
              <div className="border-t border-ink-100 px-4 py-3">
                <Pagination
                  page={safePage}
                  totalPages={totalPages}
                  total={filtered.length}
                  onPage={setPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
