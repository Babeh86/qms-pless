import { getTranslations } from "next-intl/server";
import { prisma } from "@/server/db/client";
import { requireSession } from "@/server/authz/guard";
import { permissionsOf } from "@/server/authz/permissions";
import { Badge, roleTone } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Building2, Mail, ShieldCheck, User } from "lucide-react";

export default async function ProfilePage() {
  const ctx = await requireSession();
  const t = await getTranslations("profile");
  const tLit = await getTranslations("lit");
  const permissions = permissionsOf(ctx);
  const permissionList = Array.from(permissions).sort();

  const plants = await prisma.plant.findMany({
    where: { id: { in: ctx.plantIds } },
    select: { id: true, code: true, name: true },
    orderBy: { code: "asc" },
  });
  const plantById = new Map(plants.map((p) => [p.id, p]));

  const initials = ctx.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  const info = [
    { icon: User, label: t("username"), value: ctx.username },
    { icon: User, label: t("fullName"), value: ctx.fullName },
    { icon: Mail, label: t("email"), value: ctx.email },
  ];

  return (
    <div className="max-w-4xl space-y-4">
      <PageHeader title={t("title")} />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white shadow-sm">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="text-base font-bold text-ink-900">{ctx.fullName}</p>
            <p className="text-xs text-ink-500">{ctx.email}</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {Array.from(new Set(ctx.roles.map((r) => r.role))).map((role) => (
                <Badge key={role} tone={roleTone(role)}>
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-ink-100">
              {info.map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.label} className="flex items-center justify-between gap-3 py-2.5">
                    <dt className="flex items-center gap-2 text-xs text-ink-500">
                      <Icon className="h-3.5 w-3.5 text-ink-300" aria-hidden="true" />
                      {row.label}
                    </dt>
                    <dd className="truncate text-xs font-semibold text-ink-900">{row.value}</dd>
                  </div>
                );
              })}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("roles")}</CardTitle>
          </CardHeader>
          <CardContent>
            {ctx.roles.length === 0 ? (
              <p className="text-xs text-ink-500">{t("noRoles")}</p>
            ) : (
              <ul className="space-y-2">
                {ctx.roles.map((r) => {
                  const plant = plantById.get(r.plantId);
                  return (
                    <li
                      key={`${r.role}-${r.plantId}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-ink-200 px-3 py-2"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
                        <span className="text-xs font-semibold text-ink-800">{r.role}</span>
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-ink-500">
                        <Building2 className="h-3 w-3" aria-hidden="true" />
                        {plant ? `${plant.code} — ${plant.name}` : r.plantId}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tLit("permissions")}</CardTitle>
          <Badge tone="neutral">{tLit("permissionCount", { count: permissions.size })}</Badge>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {permissionList.map((p) => (
                <code
                  key={p}
                  className="rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5 font-mono text-[10px] text-ink-600"
                >
                  {p}
                </code>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
