import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requirePermission } from "@/server/authz/guard";
import { PageHeader } from "@/components/ui/page-header";
import { NcrCreateForm } from "./ncr-create-form";

export default async function NewNcrPage({
  searchParams,
}: {
  searchParams: Promise<{
    checksheetId?: string;
    itemKey?: string;
    partNo?: string;
    partName?: string;
    lotNo?: string;
  }>;
}) {
  await requirePermission("ncr.create");
  const t = await getTranslations("ncr");
  const params = await searchParams;

  return (
    <div className="space-y-4">
      <Link
        href="/reports?view=ng#ng-register"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 transition-colors hover:text-brand-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {t("backToRegister")}
      </Link>

      <PageHeader title={t("createTitle")} description={t("createSubtitle")} />
      <NcrCreateForm
        initial={{
          checksheetId: params.checksheetId ?? "",
          checksheetItemKey: params.itemKey ?? "",
          partNo: params.partNo ?? "",
          partName: params.partName ?? "",
          lotNo: params.lotNo ?? "",
        }}
        labels={{
          partNo: t("partNo"),
          partName: t("partName"),
          lotNo: t("lotNo"),
          defectType: t("defectType"),
          defectLocation: t("location"),
          severity: t("severity"),
          description: t("description"),
          containment: t("containment"),
          pic: t("pic"),
          target: t("target"),
          save: t("create"),
          saving: t("creating"),
          cancel: t("cancel"),
          required: t("requiredFields"),
          failed: t("createFailed"),
          MINOR: t("sevMinor"),
          MAJOR: t("sevMajor"),
          CRITICAL: t("sevCritical"),
        }}
      />
    </div>
  );
}
