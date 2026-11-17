"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Users,
  Building2,
  Truck,
  ShoppingCart,
  AlertCircle,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  UserCircle2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import type { BusinessPartner, PartnerRole } from "@/lib/mock/types";
import { Badge, roleTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState, PageHeader, TableWrap, Td, Th, Tr } from "@/components/ui/page-header";
import { Pagination, SearchInput, Segmented, Toolbar } from "@/components/ui/toolbar";

const ROLE_ICONS: Record<PartnerRole, typeof Building2> = {
  COMPANY: Building2,
  SUPPLIER: Truck,
  CUSTOMER: ShoppingCart,
};

const ROLE_FILTER_KEYS: { key: PartnerRole | "ALL"; labelKey: string }[] = [
  { key: "ALL", labelKey: "all" },
  { key: "COMPANY", labelKey: "company" },
  { key: "SUPPLIER", labelKey: "supplier" },
  { key: "CUSTOMER", labelKey: "customer" },
];

const PAGE_SIZE = 8;

export function PartnersClient({ partners }: { partners: BusinessPartner[] }) {
  const t = useTranslations("master.partners");
  const tCommon = useTranslations("common");
  const tLit = useTranslations("lit");

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<PartnerRole | "ALL">("ALL");
  const [page, setPage] = useState(1);

  const [detail, setDetail] = useState<BusinessPartner | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickRole, setQuickRole] = useState<PartnerRole>("SUPPLIER");
  const [quickError, setQuickError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return partners.filter((p) => {
      const matchRole = roleFilter === "ALL" || p.roles.includes(roleFilter);
      const matchQuery =
        !q ||
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.shortName ?? "").toLowerCase().includes(q) ||
        (p.city ?? "").toLowerCase().includes(q);
      return matchRole && matchQuery;
    });
  }, [partners, query, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const incomplete = partners.filter((p) => p.createdVia === "QUICK_ADD");

  const roleCounts = {
    COMPANY: partners.filter((p) => p.roles.includes("COMPANY")).length,
    SUPPLIER: partners.filter((p) => p.roles.includes("SUPPLIER")).length,
    CUSTOMER: partners.filter((p) => p.roles.includes("CUSTOMER")).length,
  };

  const filters = ROLE_FILTER_KEYS.map((f) => ({
    key: f.key,
    label:
      f.key === "ALL"
        ? tLit("all")
        : `${tLit(f.labelKey)} (${roleCounts[f.key as PartnerRole]})`,
  }));

  function handleQuickAdd() {
    const name = quickName.trim();
    if (!name) {
      setQuickError("Nama partner wajib diisi");
      return;
    }
    const duplicate = partners.find(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) {
      setQuickError(
        `Partner "${duplicate.name}" sudah ada. Sistem akan menambahkan peran ${quickRole} ke record yang ada.`,
      );
      return;
    }
    setQuickAddOpen(false);
    setQuickName("");
    setQuickError(null);
    setToast(`Partner "${name}" ditambahkan sebagai ${quickRole} (menunggu verifikasi)`);
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <Button
              variant="outline"
              size="md"
              iconLeft={<Sparkles className="h-3.5 w-3.5" />}
              onClick={() => setQuickAddOpen(true)}
            >
              {t("quickAdd")}
            </Button>
            <Button
              size="md"
              iconLeft={<Plus className="h-4 w-4" />}
              onClick={() => setFormOpen(true)}
            >
              {t("add")}
            </Button>
          </>
        }
      />

      {/* ── Ringkasan peran ── */}
      <div className="grid gap-3 sm:grid-cols-3">
        {(["COMPANY", "SUPPLIER", "CUSTOMER"] as PartnerRole[]).map((role) => {
          const Icon = ROLE_ICONS[role];
          return (
            <div
              key={role}
              className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-4 shadow-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[11px] font-medium text-ink-500">{role}</p>
                <p className="text-lg font-bold text-ink-900 tabular">{roleCounts[role]}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Toolbar ── */}
      <Toolbar>
        <SearchInput
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
          placeholder={t("search")}
          className="w-full sm:w-72"
        />
        <Segmented
          items={filters}
          value={roleFilter}
          onChange={(v) => {
            setRoleFilter(v);
            setPage(1);
          }}
        />
        <p className="ml-auto text-xs text-ink-500">
          {tLit("countOf", { shown: filtered.length, total: partners.length, unit: tLit("partnerCount") })}
        </p>
      </Toolbar>

      <p className="flex items-start gap-2 rounded-lg border border-brand-200 bg-brand-25 px-3 py-2 text-xs text-brand-800">
        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {t("roleNote")}
      </p>

      {/* ── Tabel ── */}
      <Card>
        <CardContent className="p-0">
          {pageRows.length === 0 ? (
            <EmptyState
              title={t("empty")}
              description="Coba ubah kata kunci atau filter peran."
              icon={<Users className="h-5 w-5" />}
              action={
                <Button variant="outline" size="sm" onClick={() => { setQuery(""); setRoleFilter("ALL"); }}>
                  {tCommon("reset")}
                </Button>
              }
            />
          ) : (
            <>
              <TableWrap>
                <thead>
                  <tr>
                    <Th className="w-32">{t("code")}</Th>
                    <Th>{t("name")}</Th>
                    <Th>{t("roles")}</Th>
                    <Th className="w-24">{t("type")}</Th>
                    <Th className="w-32">{t("city")}</Th>
                    <Th className="w-24">{t("status")}</Th>
                    <Th className="w-20" align="right" />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((p) => (
                    <Tr key={p.id} onClick={() => setDetail(p)}>
                      <Td>
                        <span className="font-mono text-[11px] font-bold text-ink-800">{p.code}</span>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink-900">{p.name}</span>
                          {p.createdVia === "QUICK_ADD" ? (
                            <Badge tone="warning">{t("quickAdd")}</Badge>
                          ) : null}
                        </div>
                        {p.contactPerson ? (
                          <span className="mt-0.5 block text-[11px] text-ink-400">
                            {p.contactPerson}
                          </span>
                        ) : null}
                      </Td>
                      <Td>
                        <div className="flex flex-wrap gap-1">
                          {p.roles.map((role) => (
                            <Badge key={role} tone={roleTone(role)}>
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </Td>
                      <Td>
                        <span className="text-xs text-ink-600">{p.supplierType ?? "—"}</span>
                      </Td>
                      <Td>
                        <span className="text-xs text-ink-600">{p.city ?? "—"}</span>
                      </Td>
                      <Td>
                        {p.isActive ? (
                          <Badge tone="success" dot>
                            {t("active")}
                          </Badge>
                        ) : (
                          <Badge tone="neutral" dot>
                            {t("inactive")}
                          </Badge>
                        )}
                      </Td>
                      <Td align="right">
                        <span className="text-[11px] font-medium text-brand-600">{tLit("detailLink")}</span>
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

      {/* ── Perlu dilengkapi ── */}
      {incomplete.length > 0 ? (
        <Card>
          <CardContent>
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning-600" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-ink-900">{t("incomplete")}</p>
                <p className="mt-0.5 text-xs text-ink-500">{t("incompleteHint")}</p>
              </div>
            </div>
            <ul className="mt-3 space-y-2">
              {incomplete.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning-500/20 bg-warning-50 px-3 py-2"
                >
                  <span className="text-xs text-warning-900">
                    <span className="font-mono font-bold">{p.code}</span> — {p.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge tone="warning">{p.roles.join(", ")}</Badge>
                    <Button variant="outline" size="xs" iconLeft={<Pencil className="h-3 w-3" />}>
                      {tLit("complete")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* ── Drawer detail ── */}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ""}
        description={detail ? `Kode: ${detail.code}` : undefined}
        size="lg"
        footer={
          <>
            <Button variant="danger" size="sm" iconLeft={<Trash2 className="h-3.5 w-3.5" />}>
              {tLit("deactivate")}
            </Button>
            <Button variant="outline" size="sm" iconLeft={<Pencil className="h-3.5 w-3.5" />}>
              {tLit("edit")}
            </Button>
            <Button size="sm" onClick={() => setDetail(null)}>
              {tLit("close")}
            </Button>
          </>
        }
      >
        {detail ? (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[11px] font-semibold tracking-wide text-ink-500 uppercase">
                {tLit("roles")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {detail.roles.map((role) => (
                  <Badge key={role} tone={roleTone(role)}>
                    {role}
                  </Badge>
                ))}
              </div>
              {detail.roles.length > 1 ? (
                <p className="mt-2 text-[11px] text-ink-500">
                  {tLit("dualRoleNote")}
                </p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: MapPin, label: tLit("address"), value: detail.address ?? detail.city },
                { icon: Phone, label: tLit("phone"), value: detail.phone },
                { icon: Mail, label: tLit("email"), value: detail.email },
                { icon: UserCircle2, label: tLit("contact"), value: detail.contactPerson },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <div
                    key={row.label}
                    className="flex items-start gap-2.5 rounded-lg border border-ink-200 p-3"
                  >
                    <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium tracking-wide text-ink-400 uppercase">
                        {row.label}
                      </p>
                      <p className="truncate text-xs font-medium text-ink-800">
                        {row.value ?? "—"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-success-600" aria-hidden="true" />
              <span className="text-xs text-ink-600">
                {tLit("statusLine", { status: detail.isActive ? tLit("activeStatus") : tLit("inactiveStatus"), via: detail.createdVia === "QUICK_ADD" ? tLit("quickAdd") : tLit("manual") })}
              </span>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ── Form tambah ── */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={t("add")}
        description="Satu partner dapat memiliki lebih dari satu peran."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setFormOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button size="sm" onClick={() => setFormOpen(false)}>
              {tCommon("save")}
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={tLit("code")} required>
            <Input placeholder="PASI" />
          </Field>
          <Field label={tLit("name")} required>
            <Input placeholder="PT. PASI" />
          </Field>
          <Field label={tLit("city")}>
            <Input placeholder="Bekasi" />
          </Field>
          <Field label={tLit("supplierType")}>
            <Select defaultValue="">
              <option value="">—</option>
              <option value="PART">PART</option>
              <option value="MATERIAL">MATERIAL</option>
              <option value="BOTH">BOTH</option>
            </Select>
          </Field>
          <Field label={tLit("contact")}>
            <Input placeholder="Nama PIC" />
          </Field>
          <Field label={tLit("phone")}>
            <Input placeholder="021-xxxxxxx" />
          </Field>
          <div className="sm:col-span-2">
            <Field label={tLit("roles")} hint={tLit("checkAll")}>
              <div className="flex flex-wrap gap-3 rounded-lg border border-ink-300 p-3">
                {(["COMPANY", "SUPPLIER", "CUSTOMER"] as PartnerRole[]).map((role) => (
                  <label key={role} className="flex items-center gap-2 text-xs text-ink-700">
                    <input type="checkbox" className="h-4 w-4 rounded border-ink-300" />
                    {role}
                  </label>
                ))}
              </div>
            </Field>
          </div>
        </div>
      </Modal>

      {/* ── Quick add ── */}
      <Modal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        title={t("quickAdd")}
        description="Tambahkan partner baru tanpa meninggalkan halaman ini."
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setQuickAddOpen(false)}>
              {tCommon("cancel")}
            </Button>
            <Button size="sm" onClick={handleQuickAdd}>
              {tLit("save")}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label={tLit("partnerName")} required>
            <Input
              value={quickName}
              onChange={(e) => {
                setQuickName(e.target.value);
                setQuickError(null);
              }}
              placeholder="PT. Sumber Makmur"
              autoFocus
            />
          </Field>
          <Field label={tLit("roles")}>
            <Select value={quickRole} onChange={(e) => setQuickRole(e.target.value as PartnerRole)}>
              <option value="SUPPLIER">SUPPLIER</option>
              <option value="CUSTOMER">CUSTOMER</option>
            </Select>
          </Field>
          {quickError ? (
            <p className="rounded-md border border-warning-500/20 bg-warning-50 px-3 py-2 text-xs text-warning-800">
              {quickError}
            </p>
          ) : null}
        </div>
      </Modal>

      {/* ── Toast ── */}
      {toast ? (
        <div className="fixed right-4 bottom-4 z-50 flex items-center gap-2 rounded-lg bg-ink-900 px-4 py-3 text-xs font-medium text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-success-400" aria-hidden="true" />
          {toast}
        </div>
      ) : null}
    </div>
  );
}
