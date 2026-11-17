"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  User,
  Lock,
  ShieldCheck,
  ClipboardCheck,
  BadgeCheck,
  Eye as EyeViewer,
  Database,
  ChevronsRight,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

/**
 * Daftar akun demo (seed SPEC-0001 §9).
 * Hanya untuk mempercepat pengujian/QA — bukan fitur produksi.
 * Password dipakai bersama, diambil dari SEED_PASSWORD.
 */
export const DEMO_ACCOUNTS = [
  { username: "admin", role: "ADMIN", label: "Administrator", icon: ShieldCheck },
  { username: "mdadmin", role: "MD_ADMIN", label: "Master Data Admin", icon: Database },
  { username: "inspector1", role: "INSPECTOR", label: "QC Inspector", icon: ClipboardCheck },
  { username: "checked1", role: "CHECKED", label: "QC Supervisor", icon: BadgeCheck },
  { username: "approved1", role: "APPROVED", label: "QC Manager", icon: Sparkles },
  { username: "viewer1", role: "VIEWER", label: "Auditor", icon: EyeViewer },
] as const;

const ROLE_TONE: Record<string, "brand" | "violet" | "success" | "warning" | "info" | "neutral"> = {
  ADMIN: "neutral",
  MD_ADMIN: "brand",
  INSPECTOR: "info",
  CHECKED: "warning",
  APPROVED: "success",
  VIEWER: "violet",
};

const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "Qms#2026Dev";
const SHOW_DEMO = process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS !== "false";

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("auth.login");
  const tDemo = useTranslations("demoLogin");
  const tError = useTranslations("error");
  const router = useRouter();

  // Cek parameter ?as=username untuk pra-isi dari tautan (tanpa setState di effect)
  const preset = useMemo(() => {
    if (typeof window === "undefined") return null;
    const as = new URLSearchParams(window.location.search).get("as");
    return as && DEMO_ACCOUNTS.some((a) => a.username === as) ? as : null;
  }, []);

  const [username, setUsername] = useState(preset ?? "");
  const [password, setPassword] = useState(preset ? DEMO_PASSWORD : "");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<string | null>(preset);

  function pickAccount(user: string) {
    setUsername(user);
    setPassword(DEMO_PASSWORD);
    setSelected(user);
    setError(null);
  }

  async function signIn(user: string, pass: string) {
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.trim(), password: pass }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: { code?: string };
        } | null;
        const code = body?.error?.code;

        if (code === "RATE_LIMITED") setError(tError("rateLimited"));
        else if (code === "LOCKED") setError(tError("locked"));
        else if (code === "FORBIDDEN") setError(tError("inactive"));
        else setError(tError("loginFailed"));

        setSubmitting(false);
        return;
      }

      const target = next && next.startsWith("/") ? next : "/dashboard";
      router.replace(target);
      router.refresh();
    } catch {
      setError(tError("internal"));
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (submitting) return;

    if (!username.trim() || !password) {
      setError(tError("validation"));
      return;
    }

    await signIn(username, password);
  }

  async function quickLogin(user: string) {
    if (submitting) return;
    pickAccount(user);
    await signIn(user, DEMO_PASSWORD);
  }

  return (
    <div className="space-y-5">
      {/* ══════════ Pemilih akun demo ══════════ */}
      {SHOW_DEMO ? (
      <section aria-labelledby="demo-login-heading">
        <div className="mb-2 flex items-center justify-between">
          <h2
            id="demo-login-heading"
            className="text-[11px] font-semibold tracking-wider text-ink-400 uppercase"
          >
            {tDemo("title")}
          </h2>
          <Badge tone="warning">{tDemo("badge")}</Badge>
        </div>

        <div className="grid gap-1.5 sm:grid-cols-2">
          {DEMO_ACCOUNTS.map((account) => {
            const Icon = account.icon;
            const isActive = selected === account.username;

            return (
              <button
                key={account.username}
                type="button"
                onClick={() => quickLogin(account.username)}
                disabled={submitting}
                title={tDemo("clickToLogin", { user: account.username })}
                className={cn(
                  "group flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-all",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  isActive
                    ? "border-brand-500 bg-brand-25 ring-1 ring-brand-500/30"
                    : "border-ink-200 bg-white hover:border-brand-300 hover:bg-brand-25/50",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
                    isActive
                      ? "bg-brand-600 text-white"
                      : "bg-ink-100 text-ink-500 group-hover:bg-brand-100 group-hover:text-brand-600",
                  )}
                >
                  {isActive && submitting ? (
                    <span
                      className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"
                      aria-hidden="true"
                    />
                  ) : isActive ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono text-[11px] font-bold text-ink-900">
                    {account.username}
                  </span>
                  <span className="block truncate text-[10px] text-ink-500">{account.label}</span>
                </span>

                <Badge tone={ROLE_TONE[account.role] ?? "neutral"} className="hidden sm:inline-flex">
                  {account.role}
                </Badge>
                <ChevronsRight
                  className="h-3 w-3 shrink-0 text-ink-300 transition-colors group-hover:text-brand-500"
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>

        <p className="mt-1.5 text-[10px] text-ink-400">{tDemo("hint")}</p>
      </section>
      ) : null}

      {/* ══════════ Pemisah ══════════ */}
      {SHOW_DEMO ? (
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-ink-200" aria-hidden="true" />
        <span className="text-[10px] font-medium tracking-wider text-ink-400 uppercase">
          {tDemo("orManual")}
        </span>
        <span className="h-px flex-1 bg-ink-200" aria-hidden="true" />
      </div>
      ) : null}

      {/* ══════════ Form manual ══════════ */}
      <form onSubmit={handleSubmit} method="post" action="#" noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="username"
            className="block text-[12px] font-medium tracking-wide text-ink-700"
          >
            {t("username")}
          </label>
          <div className="relative">
            <User
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400"
              aria-hidden="true"
            />
            <Input
              id="username"
              name="username"
              autoComplete="username"
              placeholder={t("usernamePlaceholder")}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setSelected(null);
                if (error) setError(null);
              }}
              disabled={submitting}
              className="h-11 pl-9.5"
              aria-invalid={Boolean(error)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-[12px] font-medium tracking-wide text-ink-700"
          >
            {t("password")}
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-400"
              aria-hidden="true"
            />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              disabled={submitting}
              className="h-11 pr-11 pl-9.5"
              aria-invalid={Boolean(error)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              tabIndex={-1}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink-400 transition-colors hover:text-ink-700"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="animate-fade-up flex items-start gap-2 rounded-lg border border-danger-200 bg-danger-50 px-3 py-2.5"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger-600" aria-hidden="true" />
            <p className="text-xs font-medium text-danger-700">{error}</p>
          </div>
        ) : null}

        <Button
          type="submit"
          size="lg"
          loading={submitting}
          className="h-11 w-full"
          iconLeft={!submitting ? <LogIn className="h-4 w-4" /> : undefined}
        >
          {submitting ? t("submitting") : t("submit")}
        </Button>
      </form>
    </div>
  );
}
