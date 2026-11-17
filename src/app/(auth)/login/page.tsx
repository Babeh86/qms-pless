import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ShieldCheck, ClipboardCheck, LineChart, Building2 } from "lucide-react";
import { getSessionContext } from "@/server/auth/session";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSessionContext();
  if (session) redirect("/dashboard");

  const t = await getTranslations();
  const { next } = await searchParams;

  const features = [
    { icon: ClipboardCheck, text: t("loginPage.feature1") },
    { icon: ShieldCheck, text: t("loginPage.feature2") },
    { icon: LineChart, text: t("loginPage.feature3") },
  ];

  return (
    <main className="flex min-h-screen bg-white">
      {/* ── Panel branding (kiri) ── */}
      <div className="relative hidden w-1/2 shrink-0 overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-ink-900 lg:flex lg:flex-col">
        {/* Dekorasi */}
        <div
          className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-white/5 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-brand-400/10 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-1 flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-sm font-bold text-white ring-1 ring-white/20 backdrop-blur">
              QC
            </div>
            <div>
              <p className="text-sm font-bold text-white">QMS</p>
              <p className="text-[11px] text-white/60">{t("lit.appSubtitle")}</p>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-3xl leading-tight font-bold text-white">
              {t("loginPage.headline")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">{t("loginPage.subheadline")}</p>

            <ul className="mt-8 space-y-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <li key={feature.text} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                      <Icon className="h-3.5 w-3.5 text-white" aria-hidden="true" />
                    </span>
                    <span className="text-sm text-white/80">{feature.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-white/50">
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t("lit.companyCity")}
          </div>
        </div>
      </div>

      {/* ── Panel form (kanan) ── */}
      <div className="flex w-full flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          {/* Brand mobile */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
              QC
            </div>
            <div>
              <p className="text-sm font-bold text-ink-900">QMS</p>
              <p className="text-[11px] text-ink-500">{t("common.appFullName")}</p>
            </div>
          </div>

          <div className="mb-7">
            <h1 className="text-xl font-bold tracking-tight text-ink-900">{t("auth.login.title")}</h1>
            <p className="mt-1.5 text-sm text-ink-500">{t("auth.login.subtitle")}</p>
          </div>

          <LoginForm {...(next ? { next } : {})} />

          <p className="mt-8 text-center text-[11px] text-ink-400">
            {t("lit.companyCity")} · {t("lit.version")}
          </p>
        </div>
      </div>
    </main>
  );
}
