"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Globe } from "lucide-react";
import { locales, type Locale } from "@/server/i18n/config";
import { setLocaleAction } from "@/app/actions/locale";

const LOCALE_LABEL: Record<Locale, string> = {
  id: "ID",
  en: "EN",
};

export function LanguageSwitcher() {
  const current = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function change(locale: Locale) {
    if (locale === current) return;
    startTransition(async () => {
      await setLocaleAction(locale);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1 rounded-md border border-slate-300 bg-white p-1">
      <Globe className="ml-1 h-4 w-4 text-slate-500" aria-hidden="true" />
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => change(locale)}
          disabled={isPending}
          aria-pressed={locale === current}
          className={
            "rounded px-2 py-1 text-xs font-semibold transition-colors " +
            (locale === current
              ? "bg-blue-600 text-white"
              : "text-slate-600 hover:bg-slate-100")
          }
        >
          {LOCALE_LABEL[locale]}
        </button>
      ))}
    </div>
  );
}
