"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  ClipboardCheck,
  ShieldCheck,
  BarChart3,
  Settings,
  ScrollText,
  Users,
  Boxes,
  Cog,
  Factory,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  FileSpreadsheet,
  Handshake,
  Gauge,
  ShieldAlert,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  permissions: string[];
  counts?: { approval?: number };
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate?: () => void;
}

export function Sidebar({
  permissions,
  counts,
  collapsed,
  onToggleCollapsed,
  onNavigate,
}: SidebarProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const granted = new Set(permissions);

  const groups: NavGroup[] = [
    {
      title: t("nav.groupMain"),
      items: [
        { href: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
      ],
    },
    {
      title: t("nav.inspectionGroup"),
      items: [
        { href: "/inspection", label: t("nav.allInspections"), icon: ClipboardCheck },
        { href: "/inspection/cs-01", label: t("nav.incoming"), icon: Boxes },
        { href: "/inspection/cs-05", label: t("nav.patrol"), icon: Factory },
        { href: "/inspection/cs-04", label: t("nav.finalInspection"), icon: BadgeCheck },
        { href: "/inspection/cs-06", label: t("nav.dimensional"), icon: Gauge },
      ],
    },
    {
      title: t("nav.groupQuality"),
      items: [
        {
          href: "/approval",
          label: t("nav.capa"),
          icon: ShieldCheck,
          ...(counts?.approval ? { badge: counts.approval } : {}),
        },
        { href: "/reports?view=ng#ng-register", label: t("nav.ncr"), icon: ShieldAlert },
        { href: "/master/partners", label: t("nav.supplierQuality"), icon: Handshake },
        { href: "/template", label: t("nav.template"), icon: FileSpreadsheet },
      ],
    },
    {
      title: t("nav.groupMaster"),
      items: [
        { href: "/master/partners", label: t("master.partners.title"), icon: Users },
        { href: "/master/materials", label: t("master.materials.title"), icon: Boxes },
        { href: "/master/parts", label: t("master.parts.title"), icon: Cog },
        { href: "/master/machines", label: t("master.machines.title"), icon: Factory },
      ],
    },
    {
      title: t("nav.groupSystem"),
      items: [
        { href: "/reports", label: t("nav.reports"), icon: BarChart3 },
        { href: "/master", label: t("nav.masterData"), icon: Boxes },
        { href: "/settings", label: t("nav.settings"), icon: Settings },
        ...(granted.has("audit.read")
          ? [{ href: "/audit", label: t("nav.audit"), icon: ScrollText }]
          : []),
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-white/10 bg-gradient-to-b from-[#0b1d3a] via-[#10274b] to-[#10294d] text-white transition-[width] duration-200",
        collapsed ? "w-[68px]" : "w-62",
      )}
    >
      {/* Brand */}
      <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-white/10 px-4">
        <Link
          href="/dashboard"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sky-200/30 bg-gradient-to-br from-sky-400 to-blue-600 text-[11px] font-black tracking-tight text-white shadow-lg shadow-blue-950/30"
          aria-label="MANTARIS QMS"
        >
          M
        </Link>
        {!collapsed ? (
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[15px] font-extrabold tracking-[0.12em] text-white">MANTARIS</p>
            <p className="mt-0.5 truncate text-[9px] font-semibold tracking-[0.18em] text-sky-200/70">{t("nav.moduleLabel")}</p>
          </div>
        ) : null}
      </div>

      {/* Nav */}
      <div className="scrollbar-thin flex-1 overflow-y-auto px-2 py-3">
        {groups.map((group) => (
          <div key={group.title} className="mb-4 last:mb-0">
            {!collapsed ? (
              <p className="mb-2 px-2.5 text-[9px] font-bold tracking-[0.16em] text-sky-200/45 uppercase">
                {group.title}
              </p>
            ) : (
              <div className="mx-2 mb-2 border-t border-ink-100" />
            )}

            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/inspection" && item.href !== "/master" && pathname.startsWith(`${item.href}/`));
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors duration-150",
                        isActive
                          ? "bg-sky-400/15 text-white shadow-sm ring-1 ring-sky-300/15"
                          : "text-slate-300 hover:bg-white/[0.07] hover:text-white",
                      )}
                    >
                      {isActive ? (
                        <span
                          className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r bg-sky-300"
                          aria-hidden="true"
                        />
                      ) : null}
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive ? "text-sky-300" : "text-slate-400 group-hover:text-sky-100",
                        )}
                      />
                      {!collapsed ? (
                        <>
                          <span className="truncate">{item.label}</span>
                          {item.badge ? (
                              <span className="ml-auto rounded-md bg-orange-400/15 px-1.5 py-0.5 text-[10px] font-bold text-orange-200 tabular">
                              {item.badge}
                            </span>
                          ) : null}
                        </>
                      ) : item.badge ? (
                        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-warning-500" />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Collapse toggle */}
      <div className="shrink-0 border-t border-white/10 p-2">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-medium text-slate-400 transition-colors hover:bg-white/[0.07] hover:text-white"
          aria-label={collapsed ? "Perluas menu" : "Ciutkan menu"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4 shrink-0" />
              <span>{t("lit.collapse")}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

/* Wrapper yang mengelola state collapsed + drawer mobile.
   Children dioper sebagai ReactNode (bukan render prop) agar aman dari
   Server Component. Tombol menu mobile dirender di dalam wrapper ini. */
export function SidebarShell({
  permissions,
  counts,
  children,
}: {
  permissions: string[];
  counts?: { approval?: number };
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const mobileMenuButton = (
    <button
      type="button"
      onClick={() => setMobileOpen(true)}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 transition-colors hover:bg-ink-100 lg:hidden"
      aria-label="Buka menu"
    >
      <Menu className="h-4 w-4" />
    </button>
  );

  return (
    <>
      {/* Desktop */}
      <div className="sticky top-0 hidden h-screen shrink-0 lg:block">
        <Sidebar
          permissions={permissions}
          {...(counts ? { counts } : {})}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
        />
      </div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-[1px]"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="animate-fade-up absolute inset-y-0 left-0 shadow-xl">
            <Sidebar
              permissions={permissions}
              {...(counts ? { counts } : {})}
              collapsed={false}
              onToggleCollapsed={() => setMobileOpen(false)}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {mobileMenuButton}
        {children}
      </div>
    </>
  );
}
