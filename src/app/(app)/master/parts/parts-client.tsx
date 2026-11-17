"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Cog, Pencil, Layers } from "lucide-react";
import type { Part } from "@/lib/mock/types";
import { materialById, partnerByCode } from "@/lib/mock/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, PageHeader, TableWrap, Td, Th, Tr } from "@/components/ui/page-header";
import { Pagination, SearchInput, Toolbar } from "@/components/ui/toolbar";

const PAGE_SIZE = 10;

export function PartsClient({ parts }: { parts: Part[] }) {
  const t = useTranslations("master.parts");
  const tCommon = useTranslations("common");
  const tLit = useTranslations("lit");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return parts;
    return parts.filter(
      (p) =>
        p.partNo.toLowerCase().includes(q) ||
        p.partName.toLowerCase().includes(q) ||
        (p.model ?? "").toLowerCase().includes(q) ||
        (p.moldCode ?? "").toLowerCase().includes(q),
    );
  }, [parts, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button size="md" iconLeft={<Plus className="h-4 w-4" />}>
            {t("add")}
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
          placeholder="Cari part no, nama, model, atau mold code…"
          className="w-full sm:w-80"
        />
        <p className="ml-auto text-xs text-ink-500">
          {tLit("countOf", { shown: filtered.length, total: parts.length, unit: tLit("partCount") })}
        </p>
      </Toolbar>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <EmptyState
              title={t("empty")}
              description="Belum ada part yang cocok dengan pencarian."
              icon={<Cog className="h-5 w-5" />}
              action={
                <Button variant="outline" size="sm" onClick={() => setQuery("")}>
                  {tCommon("reset")}
                </Button>
              }
            />
          ) : (
            <>
              <TableWrap>
                <thead>
                  <tr>
                    <Th className="w-40">{t("partNo")}</Th>
                    <Th>{t("partName")}</Th>
                    <Th className="w-20">{t("model")}</Th>
                    <Th>{t("material")}</Th>
                    <Th className="w-24" align="center">
                      {t("cavity")}
                    </Th>
                    <Th className="w-32">{t("mold")}</Th>
                    <Th>{t("supplier")}</Th>
                    <Th className="w-16" align="right" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <Tr key={p.id}>
                      <Td>
                        <span className="font-mono text-[11px] font-bold text-ink-800">
                          {p.partNo}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-medium text-ink-900">{p.partName}</span>
                      </Td>
                      <Td>
                        <span className="text-xs text-ink-600">{p.model ?? "—"}</span>
                      </Td>
                      <Td>
                        <span className="text-xs text-ink-600">
                          {materialById(p.materialId)?.name ?? "—"}
                        </span>
                      </Td>
                      <Td align="center">
                        <Badge tone="brand">
                          <Layers className="h-2.5 w-2.5" aria-hidden="true" />
                          {p.defaultCavityCount}
                        </Badge>
                      </Td>
                      <Td>
                        <span className="font-mono text-[11px] text-ink-600">
                          {p.moldCode ?? "—"}
                        </span>
                      </Td>
                      <Td>
                        <span className="text-xs text-ink-600">
                          {partnerByCode(p.supplierCode)?.shortName ??
                            partnerByCode(p.supplierCode)?.name ??
                            "—"}
                        </span>
                      </Td>
                      <Td align="right">
                        <Button variant="ghost" size="icon-sm" aria-label={tLit("edit")}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Td>
                    </Tr>
                  ))}
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
