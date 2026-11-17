"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDown, LogOut, User, Languages, Building2, Bell, Search, CircleHelp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, roleTone } from "@/components/ui/badge";
import { locales, type Locale } from "@/server/i18n/config";
import { setLocaleAction } from "@/app/actions/locale";
import { cn } from "@/lib/utils/cn";

interface TopbarProps {
  fullName: string;
  username: string;
  roles: string[];
  plantName?: string;
  currentLocale: Locale;
  menuButton?: React.ReactNode;
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/inspection": "Inspeksi",
  "/approval": "Antrian Persetujuan",
  "/reports": "Laporan",
  "/master/partners": "Business Partner",
  "/master/materials": "Material",
  "/master/parts": "Part",
  "/master/machines": "Mesin",
  "/template": "Template",
  "/settings": "Pengaturan",
  "/audit": "Audit Trail",
  "/settings/profile": "Profil",
};

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function Topbar({
  fullName,
  username,
  roles,
  plantName,
  currentLocale,
  menuButton,
}: TopbarProps) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  async function switchLocale(locale: Locale) {
    setLangOpen(false);
    await setLocaleAction(locale);
    router.refresh();
  }

  const title =
    PAGE_TITLES[pathname] ??
    PAGE_TITLES[Object.keys(PAGE_TITLES).find((k) => pathname.startsWith(`${k}/`)) ?? ""] ??
    "QMS";
  const breadcrumb = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.toUpperCase().startsWith("CS-") ? segment.toUpperCase() : segment.replaceAll("-", " "));

  return (
    <header className="sticky top-0 z-30 flex h-[68px] shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-6">
      {menuButton}

      <div className="hidden min-w-0 sm:block">
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
          <span>MANTARIS</span><ChevronRight className="h-3 w-3" />
          {breadcrumb.slice(0, -1).map((crumb, index) => <span key={`${crumb}-${index}`} className="capitalize">{crumb}</span>)}
        </div>
        <p className="mt-0.5 truncate text-[13px] font-semibold text-slate-800">{title}</p>
      </div>

      <form
        className="ml-auto hidden w-full max-w-[360px] md:flex"
        action="/inspection"
        role="search"
      >
        <div className="flex h-9 w-full items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
          <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <input name="q" type="search" placeholder="Cari nomor dokumen, part, atau lot..." aria-label="Cari inspeksi" className="w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400" />
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] text-slate-400">{t("common.searchShortcut")}</kbd>
        </div>
      </form>

      <div className="flex items-center gap-1.5">
        {plantName ? (
          <span className="mr-1 hidden items-center gap-1.5 rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-1.5 text-[11px] font-medium text-ink-600 md:inline-flex">
            <Building2 className="h-3 w-3 text-ink-400" aria-hidden="true" />
            {plantName}
          </span>
        ) : null}

        <Button variant="ghost" size="icon-sm" aria-label="Notifikasi" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-danger-500 ring-2 ring-white" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Bantuan" title="Pusat bantuan">
          <CircleHelp className="h-4 w-4" />
        </Button>

        {/* Language */}
        <div className="relative" ref={langRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLangOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={langOpen}
            className="gap-1.5"
          >
            <Languages className="h-4 w-4" aria-hidden="true" />
            <span className="text-[11px] font-bold uppercase">{currentLocale}</span>
          </Button>
          {langOpen ? (
            <div
              role="menu"
              className="absolute right-0 mt-1 w-36 overflow-hidden rounded-lg border border-ink-200 bg-white py-1 shadow-lg"
            >
              {locales.map((locale) => (
                <button
                  key={locale}
                  type="button"
                  role="menuitem"
                  onClick={() => switchLocale(locale)}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-ink-50",
                    locale === currentLocale
                      ? "font-semibold text-brand-600"
                      : "text-ink-700",
                  )}
                >
                  {locale === "id" ? t("common.indonesian") : t("common.english")}
                  <span className="text-[10px] font-bold uppercase">{locale}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mx-1 h-6 w-px bg-ink-200" aria-hidden="true" />

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            className="flex items-center gap-2 rounded-lg py-1 pr-1.5 pl-1 transition-colors hover:bg-ink-100"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[10px] font-bold text-white">
              {initials(fullName)}
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block max-w-32 truncate text-[12px] font-semibold text-ink-900">
                {fullName}
              </span>
              <span className="block max-w-32 truncate text-[10px] text-ink-500">{username}</span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
          </button>

          {userMenuOpen ? (
            <div
              role="menu"
              className="absolute right-0 mt-1 w-60 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg"
            >
              <div className="border-b border-ink-100 px-4 py-3">
                <p className="truncate text-xs font-semibold text-ink-900">{fullName}</p>
                <p className="truncate text-[11px] text-ink-500">{username}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {roles.map((role) => (
                    <Badge key={role} tone={roleTone(role)}>
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="py-1">
                <Link
                  href="/settings/profile"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs text-ink-700 transition-colors hover:bg-ink-50"
                >
                  <User className="h-3.5 w-3.5 text-ink-400" aria-hidden="true" />
                  {t("nav.profile")}
                </Link>
              </div>

              <div className="border-t border-ink-100 py-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={signOut}
                  disabled={signingOut}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-xs font-medium text-danger-600 transition-colors hover:bg-danger-50 disabled:opacity-60"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("auth.logout")}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
