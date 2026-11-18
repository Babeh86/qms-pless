import { redirect } from "next/navigation";
import { getSessionContext } from "@/server/auth/session";
import { permissionsOf } from "@/server/authz/permissions";
import { getLocale } from "next-intl/server";
import { SidebarShell } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { Locale } from "@/server/i18n/config";
import { OfflineSyncProvider } from "@/components/offline/offline-sync-provider";
import { OfflineStatusBanner } from "@/components/offline/offline-status-banner";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  const locale = (await getLocale()) as Locale;
  const permissions = Array.from(permissionsOf(session));
  const roles = Array.from(new Set(session.roles.map((r) => r.role)));

  return (
    <OfflineSyncProvider userId={session.userId}>
    <div className="flex min-h-screen bg-[linear-gradient(135deg,#f4f8fd_0%,#f8fafc_48%,#eef5fc_100%)]">
      <SidebarShell permissions={permissions} counts={{ approval: 3 }}>
        <Topbar
          fullName={session.fullName}
          username={session.username}
          roles={roles}
          plantName="KARAWANG"
          currentLocale={locale}
        />
        <main className="mx-auto w-full max-w-[1760px] flex-1 px-4 py-5 sm:px-6 lg:px-8 xl:px-9">
          <OfflineStatusBanner />
          <div className="animate-fade-up">{children}</div>
        </main>
        <footer className="mt-auto border-t border-ink-200 bg-white/60 px-4 py-3 text-center text-[11px] text-ink-400 sm:px-6 lg:px-8">
          {"QMS v1.0 · PT. Plasess Indonesia · © 2026"}
        </footer>
      </SidebarShell>
    </div>
    </OfflineSyncProvider>
  );
}
