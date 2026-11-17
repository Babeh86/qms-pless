/**
 * Config terpusat dari environment variable.
 * Semua akses env WAJIB lewat modul ini agar mudah diaudit.
 */

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Environment variable ${name} wajib diisi`);
  }
  return value;
}

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} harus berupa angka, diterima: "${raw}"`);
  }
  return parsed;
}

export const config = {
  env: process.env.NODE_ENV ?? "development",
  appUrl: process.env.APP_URL ?? "http://localhost:3000",

  session: {
    cookieName: required("SESSION_COOKIE_NAME", "qms_session"),
    /** Batas absolut session (jam). Tidak pernah diperpanjang. */
    absoluteHours: int("SESSION_ABSOLUTE_HOURS", 12),
    /** Batas idle (menit). Diperpanjang bila ada aktivitas. */
    idleMinutes: int("SESSION_IDLE_MINUTES", 60),
  },

  login: {
    maxAttempts: int("LOGIN_MAX_ATTEMPTS", 5),
    lockoutMinutes: int("LOGIN_LOCKOUT_MINUTES", 15),
    rateLimitPerMinute: int("LOGIN_RATE_LIMIT_PER_MINUTE", 5),
    rateLimitUsernamePerMinute: int("LOGIN_RATE_LIMIT_USERNAME_PER_MINUTE", 20),
  },

  i18n: {
    defaultLocale: (process.env.DEFAULT_LOCALE ?? "id") as "id" | "en",
    locales: (process.env.SUPPORTED_LOCALES ?? "id,en").split(",").map((s) => s.trim()) as (
      | "id"
      | "en"
    )[],
    cookieName: "qms_locale",
  },

  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
} as const;

export type AppConfig = typeof config;
