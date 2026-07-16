"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  Clock3,
  Languages,
  LayoutGrid,
  MapPin,
  MoreHorizontal,
  Settings,
  ShoppingBag,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  cabinetMobileHeaderClass,
  cabinetMobileNavClass,
  cabinetNavActiveClass,
  cabinetNavIdleClass,
  cabinetNavLinkClass,
  cabinetSidebarClass,
  cabinetBorderDividerClass,
} from "@/lib/cabinet-ui";
import { siteContainerClass } from "@/lib/site-container";
import ArgentinaLogo from "@/components/ArgentinaLogo";
import AdminCronHealthBanner from "@/components/admin/AdminCronHealthBanner";
import UserAvatar from "@/components/auth/UserAvatar";
import AdminBreadcrumbs from "@/components/admin/AdminBreadcrumbs";
import {
  AdminCommandPaletteButton,
  AdminDarkSidebarToggle,
  AdminDenseTableToggle,
} from "@/components/admin/AdminLayoutControls";
import AdminNotificationsMenu from "@/components/admin/AdminNotificationsMenu";
import { useAuth } from "@/context/AuthContext";
import { useAdminContext } from "@/context/AdminContext";
import { useAdminLayoutPrefs } from "@/context/AdminLayoutPrefsContext";
import {
  ADMIN_NAV_ITEMS,
  ADMIN_NAV_SECTION_LABELS,
  filterAdminNavItems,
  groupAdminNavItems,
} from "@/lib/admin/nav-config";
import type { AdminNavItemId } from "@/types/admin";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MOBILE_PRIMARY_NAV_IDS: AdminNavItemId[] = [
  "dashboard",
  "operations-hub",
  "operations-bookings",
];

const NAV_ICONS: Partial<Record<AdminNavItemId, typeof LayoutGrid>> = {
  dashboard: LayoutGrid,
  "operations-hub": LayoutGrid,
  "operations-leads": ClipboardList,
  "operations-bookings": ClipboardList,
  "operations-payments": Wallet,
  "operations-shop": ShoppingBag,
  "marketplace-tours": MapPin,
  "marketplace-excursions": MapPin,
  "marketplace-organizers": Users,
  "marketplace-experts": Users,
  "marketplace-moderation": Shield,
  "content-documents": BookOpen,
  "content-map": MapPin,
  "content-media": BookOpen,
  "content-translations": Languages,
  "content-freshness": Clock3,
  "users-list": Users,
  "analytics-overview": BarChart3,
  "system-settings": Settings,
  "system-feature-flags": Settings,
  "system-staff": Shield,
  "system-audit": Shield,
};

function isNavActive(pathname: string, href: string): boolean {
  const closestMatch = ADMIN_NAV_ITEMS.reduce<(typeof ADMIN_NAV_ITEMS)[number] | null>(
    (current, candidate) => {
      const matches = pathname === candidate.href || pathname.startsWith(`${candidate.href}/`);
      if (!matches || (current && current.href.length >= candidate.href.length)) return current;
      return candidate;
    },
    null,
  );

  return closestMatch?.href === href;
}

function AdminNavLink({
  item,
  compact,
  onNavigate,
}: {
  item: { href: string; label: string; id: AdminNavItemId };
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isNavActive(pathname, item.href);
  const Icon = NAV_ICONS[item.id] ?? LayoutGrid;

  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn(
        cabinetNavLinkClass,
        "flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active ? cn(cabinetNavActiveClass, "admin-nav-active") : cn(cabinetNavIdleClass, "admin-nav-idle"),
        compact && "justify-center px-2"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {!compact ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );

  if (!compact) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

export function AdminMobileHeader({ buildVersionChip }: { buildVersionChip?: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <header className={cabinetMobileHeaderClass}>
      <Link href="/admin" className="flex min-h-11 items-center gap-2">
        <ArgentinaLogo className="h-7 w-auto" />
        <span className="font-heading text-sm font-bold text-foreground">Админ</span>
        {buildVersionChip}
      </Link>
      {user ? (
        <UserAvatar name={user.fullName} avatarUrl={user.avatarUrl} className="h-9 w-9 text-sm" />
      ) : null}
    </header>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();
  const { capabilities } = useAdminContext();
  const items = filterAdminNavItems(capabilities);
  const [moreOpen, setMoreOpen] = useState(false);
  const activeItem = items.find((item) => isNavActive(pathname, item.href));
  const defaultPrimaryItems = items.filter((item) => MOBILE_PRIMARY_NAV_IDS.includes(item.id));
  const primaryItems = activeItem && !MOBILE_PRIMARY_NAV_IDS.includes(activeItem.id)
    ? [...defaultPrimaryItems.slice(0, 2), activeItem]
    : defaultPrimaryItems;
  const groups = groupAdminNavItems(items);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  return (
    <>
      <nav className={cabinetMobileNavClass} aria-label="Основные разделы админ-панели">
        {primaryItems.map((item) => (
          <AdminNavLink key={item.id} item={item} />
        ))}
        <button
          type="button"
          aria-expanded={moreOpen}
          aria-controls="admin-mobile-all-sections"
          onClick={() => setMoreOpen(true)}
          className={cn(
            cabinetNavLinkClass,
            "flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            moreOpen ? cabinetNavActiveClass : cabinetNavIdleClass,
          )}
        >
          <MoreHorizontal className="h-4 w-4 shrink-0" aria-hidden />
          Ещё
        </button>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent
          id="admin-mobile-all-sections"
          className="p-0 md:hidden"
          aria-label="Все разделы админ-панели"
        >
          <DialogHeader className="pr-16">
            <DialogTitle>Все разделы</DialogTitle>
            <DialogDescription>Управление продажами, контентом и настройками сайта</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-6 overflow-y-auto pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]">
            {Array.from(groups.entries()).map(([sectionId, sectionItems]) => (
              <section key={sectionId} aria-labelledby={`admin-mobile-section-${sectionId}`}>
                <h2
                  id={`admin-mobile-section-${sectionId}`}
                  className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted"
                >
                  {ADMIN_NAV_SECTION_LABELS[sectionId]}
                </h2>
                <div className="grid gap-1 sm:grid-cols-2">
                  {sectionItems.map((item) => (
                    <AdminNavLink
                      key={item.id}
                      item={item}
                      onNavigate={() => setMoreOpen(false)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AdminSidebar({ buildVersionChip }: { buildVersionChip?: React.ReactNode }) {
  const { user } = useAuth();
  const { capabilities } = useAdminContext();
  const { darkSidebar } = useAdminLayoutPrefs();
  const items = filterAdminNavItems(capabilities);
  const groups = groupAdminNavItems(items);

  return (
    <aside
      className={cn(
        cabinetSidebarClass,
        "w-64 p-4",
        darkSidebar &&
          "border-slate-700 bg-slate-900 text-slate-200 [&_.admin-nav-section]:text-slate-400 [&_.admin-nav-idle]:text-slate-300 [&_.admin-nav-idle:hover]:bg-slate-800 [&_.admin-nav-idle:hover]:text-white [&_.admin-nav-active]:bg-sky/20 [&_.admin-nav-active]:text-sky-200 [&_.admin-nav-active]:ring-sky/30 [&_.admin-sidebar-divider]:border-slate-700 [&_.admin-sidebar-muted]:text-slate-400 [&_.admin-sidebar-link]:text-sky-300 [&_.admin-sidebar-title]:text-white [&_.admin-sidebar-user]:text-white [&_.admin-layout-control]:border-slate-600 [&_.admin-layout-control]:hover:bg-slate-800 [&_.admin-layout-control]:hover:text-white [&_.admin-layout-toggle]:hover:bg-slate-800 [&_.admin-layout-toggle]:hover:text-white"
      )}
      aria-label="Админ-панель"
    >
      <div className="mb-6 flex items-center justify-between gap-2 px-1">
        <Link href="/admin" className="flex items-center gap-2">
          <ArgentinaLogo className="h-8 w-auto" />
          <div>
            <p className="admin-sidebar-title font-heading text-sm font-bold text-charcoal">Админ-панель</p>
            <div className="flex items-center gap-2">
              <p className="admin-sidebar-muted text-xs text-slate">Пора в Аргентину</p>
              {buildVersionChip}
            </div>
          </div>
        </Link>
        <AdminNotificationsMenu />
      </div>

      <div className="mb-4 space-y-2">
        <AdminCommandPaletteButton />
        <div className="flex flex-wrap gap-1">
          <AdminDenseTableToggle />
          <AdminDarkSidebarToggle />
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-0.5 pb-2 scrollbar-thin">
        {Array.from(groups.entries()).map(([sectionId, sectionItems]) => (
          <div key={sectionId} className="mb-5 last:mb-0">
            <p
              className="admin-nav-section mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate/80"
            >
              {ADMIN_NAV_SECTION_LABELS[sectionId]}
            </p>
            <div className="flex flex-col gap-0.5">
              {sectionItems.map((item) => (
                <AdminNavLink key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {user ? (
        <div className={cn("admin-sidebar-divider mt-auto border-t pt-4", cabinetBorderDividerClass)}>
          <div className="flex items-center gap-2 px-2">
            <UserAvatar name={user.fullName} avatarUrl={user.avatarUrl} className="h-9 w-9 text-sm" />
            <div className="min-w-0">
              <p className="admin-sidebar-user truncate text-sm font-medium text-foreground">{user.fullName}</p>
              <Link href="/" className="admin-sidebar-link text-xs text-sky hover:underline">
                На сайт
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
      <div className="min-w-0">
        <h1 className="font-heading text-2xl font-bold text-foreground">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex w-full flex-wrap gap-2 sm:w-auto">{actions}</div> : null}
    </header>
  );
}

export function AdminPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(siteContainerClass, "pb-10")}>
      <AdminBreadcrumbs className="mb-3 sm:mb-4" />
      <AdminCronHealthBanner />
      <div className="space-y-6 md:space-y-8">{children}</div>
    </div>
  );
}
