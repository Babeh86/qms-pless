"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Upload, Boxes, Pencil, MapPin } from "lucide-react";
import type { Material } from "@/lib/mock/types";
import { partnerByCode } from "@/lib/mock/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, PageHeader, TableWrap, Td, Th, Tr } from "@/components/ui/page-header";
import { Pagination, SearchInput, Toolbar } from "@/components/ui/toolbar";

const PAGE_SIZE = 10;

const TYPE_TONE: Record<string, "brand" | "warning" | "violet" | "neutral"> = {
  RESIN: "brand",
  METAL_COIL: "warning",
  SHEET: "violet",
  OTHER: "neutral",
};

export function MaterialsClient({ materials }: { materials: Material[] }) {
  const t = useTranslations("master.materials");
  const tCommon = useTranslations("common");
  const tLit = useTranslations("lit");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return materials;
    return materials.filter(
      (m) =>
        m.code.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        (m.grade ?? "").toLowerCase().includes(q) ||
        (m.color ?? "").toLowerCase().includes(q),
    );
  }, [materials, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <Button variant="outline" size="md" iconLeft={<Upload className="h-3.5 w-3.5" />}>
              {t("import")}
            </Button>
            <Button size="md" iconLeft={<Plus className="h-4 w-4" />}>
              {t("add")}
            </Button>
          </>
        }
      />

      <Toolbar>
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder="Cari kode, nama, grade, atau warna…"
          className="w-full sm:w-80"
        />
        <p className="ml-auto text-xs text-ink-500">
          {tLit("countOf", { shown: filtered.length, total: materials.length, unit: tLit("materialCount") })}
        </p>
      </Toolbar>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <EmptyState
              title={t("empty")}
              description="Belum ada material yang cocok dengan pencarian."
              icon={<Boxes className="h-5 w-5" />}
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
                    <Th className="w-44">{t("code")}</Th>
                    <Th>{t("name")}</Th>
                    <Th className="w-24">{t("type")}</Th>
                    <Th className="w-24">{t("color")}</Th>
                    <Th className="w-32">{t("size")}</Th>
                    <Th>{t("supplier")}</Th>
                    <Th className="w-20" align="right" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m) => (
                    <Tr key={m.id}>
                      <Td>
                        <span className="font-mono text-[11px] font-bold text-ink-800">{m.code}</span>
                      </Td>
                      <Td>
                        <span className="font-medium text-ink-900">{m.name}</span>
                        {m.additiveMasterbatch ? (
                          <span className="mt-0.5 block text-[11px] text-ink-400">
                            {m.additiveMasterbatch}
                          </span>
                        ) : null}
                      </Td>
                      <Td>
                        <Badge tone={TYPE_TONE[m.materialType] ?? "neutral"}>
                          {m.materialType}
                        </Badge>
                      </Td>
                      <Td>
                        <span className="text-xs text-ink-600">{m.color ?? "—"}</span>
                      </Td>
                      <Td>
                        <span className="text-xs text-ink-600">{m.sizeSpec ?? "—"}</span>
                      </Td>
                      <Td>
                        <span className="flex items-center gap-1.5 text-xs text-ink-600">
                          <MapPin className="h-3 w-3 text-ink-300" aria-hidden="true" />
                          {partnerByCode(m.supplierCode)?.shortName ??
                            partnerByCode(m.supplierCode)?.name ??
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
