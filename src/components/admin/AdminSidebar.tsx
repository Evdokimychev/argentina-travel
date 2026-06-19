"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  LayoutGrid,
  MapPin,
  Settings,
  ShoppingBag,
  Shield,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  cabinetMobileHeaderClass,
  cabinetMobileNavClass,
  cabinetNavActiveClass,
  cabinetNavIdleClass,
  cabinetSidebarClass,
} from "@/lib/cabinet-ui";
import { siteContainerClass } from "@/lib/site-container";
import ArgentinaLogo from "@/components/ArgentinaLogo";
import UserAvatar from "@/components/auth/UserAvatar";
import AdminNotificationsMenu from "@/components/admin/AdminNotificationsMenu";
import { useAuth } from "@/context/AuthContext";
import { useAdminContext } from "@/context/AdminContext";
import {
  ADMIN_NAV_SECTION_LABELS,
  filterAdminNavItems,
  groupAdminNavItems,
} from "@/lib/admin/nav-config";
import type { AdminNavItemId } from "@/types/admin";

const NAV_ICONS: Partial<Record<AdminNavItemId, typeof LayoutGrid>> = {
  dashboard: LayoutGrid,
  "operations-hub": LayoutGrid,
  "operations-leads": ClipboardList,
  "operations-bookings": ClipboardList,
  "operations-payments": Wallet,
  "operations-shop": ShoppingBag,
  "marketplace-tours": MapPin,
  "marketplace-excursions": MapPin,
  "marketplace-moderation": Shield,
  "content-documents": BookOpen,
  "users-list": Users,
  "analytics-overview": BarChart3,
  "system-settings": Settings,
  "system-staff": Shield,
  "system-audit": Shield,
};

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/admin" || href === "/admin/operations") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AdminNavLink({ item, compact }: { item: { href: string; label: string; id: AdminNavItemId }; compact?: boolean }) {
  const pathname = usePathname();
  const active = isNavActive(pathname, item.href);
  const Icon = NAV_ICONS[item.id] ?? LayoutGrid;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active ? cabinetNavActiveClass : cabinetNavIdleClass,
        compact && "justify-center px-2"
      )}
      title={compact ? item.label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {!compact ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}

export function AdminMobileHeader({ buildVersionChip }: { buildVersionChip?: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <header className={cabinetMobileHeaderClass}>
      <Link href="/admin" className="flex items-center gap-2">
        <ArgentinaLogo className="h-7 w-auto" />
        <span className="font-heading text-sm font-bold text-charcoal">Админ</span>
        {buildVersionChip}
      </Link>
      {user ? (
        <UserAvatar name={user.fullName} avatarUrl={user.avatarUrl} className="h-9 w-9 text-sm" />
      ) : null}
    </header>
  );
}

export function AdminMobileNav() {
  const { capabilities } = useAdminContext();
  const items = filterAdminNavItems(capabilities);

  return (
    <nav className={cabinetMobileNavClass} aria-label="Разделы админ-панели">
      {items.map((item) => (
        <AdminNavLink key={item.id} item={item} />
      ))}
    </nav>
  );
}

export default function AdminSidebar({ buildVersionChip }: { buildVersionChip?: React.ReactNode }) {
  const { user } = useAuth();
  const { capabilities } = useAdminContext();
  const items = filterAdminNavItems(capabilities);
  const groups = groupAdminNavItems(items);

  return (
    <aside className={cn(cabinetSidebarClass, "w-64 p-4")} aria-label="Админ-панель">
      <div className="mb-6 flex items-center justify-between gap-2 px-1">
        <Link href="/admin" className="flex items-center gap-2">
          <ArgentinaLogo className="h-8 w-auto" />
          <div>
            <p className="font-heading text-sm font-bold text-charcoal">Админ-панель</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate">Пора в Аргентину</p>
              {buildVersionChip}
            </div>
          </div>
        </Link>
        <AdminNotificationsMenu />
      </div>

      <nav className="flex flex-col gap-5">
        {Array.from(groups.entries()).map(([sectionId, sectionItems]) => (
          <div key={sectionId}>
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate/80">
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
        <div className="mt-auto border-t border-gray-100 pt-4">
          <div className="flex items-center gap-2 px-2">
            <UserAvatar name={user.fullName} avatarUrl={user.avatarUrl} className="h-9 w-9 text-sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-charcoal">{user.fullName}</p>
              <Link href="/" className="text-xs text-sky hover:underline">
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
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-heading text-2xl font-bold text-charcoal">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function AdminPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(siteContainerClass, "pb-10")}>
      <div className="space-y-8">{children}</div>
    </div>
  );
}
