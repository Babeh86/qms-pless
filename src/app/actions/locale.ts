"use server";

import { cookies } from "next/headers";
import { isLocale, localeCookieName, type Locale } from "@/server/i18n/config";

/**
 * Menyimpan preferensi bahasa pada cookie.
 * Diakses dari client melalui Server Action agar tidak memutasi
 * `document.cookie` secara langsung.
 */
export async function setLocaleAction(locale: string): Promise<void> {
  if (!isLocale(locale)) return;

  const store = await cookies();
  store.set({
    name: localeCookieName,
    value: locale satisfies Locale,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
