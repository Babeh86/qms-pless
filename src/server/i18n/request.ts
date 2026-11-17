import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { defaultLocale, isLocale, localeCookieName, locales } from "./config";

/**
 * Konfigurasi next-intl (SPEC-0001 §7).
 * Locale ditentukan dari cookie, lalu Accept-Language, lalu default.
 */
export default getRequestConfig(async () => {
  let locale = defaultLocale;

  try {
    const cookieStore = await cookies();
    const fromCookie = cookieStore.get(localeCookieName)?.value;
    if (isLocale(fromCookie)) {
      locale = fromCookie;
    } else {
      const headerStore = await headers();
      const acceptLanguage = headerStore.get("accept-language") ?? "";
      const preferred = acceptLanguage
        .split(",")
        .map((part) => part.split(";")[0]?.trim().slice(0, 2).toLowerCase())
        .find((tag) => isLocale(tag));
      if (isLocale(preferred)) locale = preferred;
    }
  } catch {
    // Di luar konteks request (mis. build) — gunakan default.
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: "Asia/Jakarta",
  };
});

export { locales };
