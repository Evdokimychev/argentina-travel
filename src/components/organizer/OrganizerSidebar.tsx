"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  LayoutGrid,
  Mail,
  Settings,
  Star,
  Wallet,
} from "lucide-react";
import ArgentinaLogo from "@/components/ArgentinaLogo";
import UserAvatar from "@/components/auth/UserAvatar";
import NotificationsBell from "@/components/notifications/NotificationsBell";
import { cn } from "@/lib/cn";
import {
  cabinetMobileHeaderClass,
  cabinetMobileNavClass,
  cabinetNavBadgeClass,
  cabinetNavActiveClass,
  cabinetNavIdleClass,
  cabinetNavLinkClass,
  cabinetSidebarClass,
  cabinetSidebarSkeletonClass,
  cabinetBorderDividerClass,
  cabinetMutedSurfaceClass,
  cabinetSurfaceButtonClass,
} from "@/lib/cabinet-ui";
import { ORGANIZER_NAV_ITEMS, type OrganizerNavId } from "@/data/organizer-dashboard";
import { useAuth } from "@/context/AuthContext";
import { getOrganizerNavItemsWithBadges } from "@/lib/organizer-bookings";
import { getLocalOrganizerInboxUnreadCount } from "@/lib/organizer-inbox";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { BOOKINGS_UPDATED_EVENT } from "@/types/tourist";
import { MESSAGES_UPDATED_EVENT } from "@/types/messages";
import { ORGANIZER_INBOX_UPDATED_EVENT } from "@/types/organizer-inbox";
import { NOTIFICATIONS_HUB_UPDATED_EVENT } from "@/types/notifications-hub";
import { SITE_LEGAL_LINKS } from "@/data/site-links";

const SIDEBAR_COLLAPSED_KEY = "organizer-sidebar-collapsed";
/** Ниже этой ширины окна сайдбар сворачивается автоматически */
const AUTO_COLLAPSE_MAX_WIDTH = 1279;

const NAV_ICONS: Record<OrganizerNavId, typeof LayoutGrid> = {
  dashboard: LayoutGrid,
  analytics: BarChart3,
  tours: Compass,
  bookings: Clock3,
  messages: Mail,
  reviews: Star,
  payments: Wallet,
};

interface OrganizerSidebarProps {
  userName?: string;
  avatarUrl?: string | null;
  /** Принудительно компактный режим (планшет) */
  forceCompact?: boolean;
}

function readCollapsedPreference(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsedPreference(collapsed: boolean) {
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    /* ignore */
  }
}

async function loadOrganizerNavItemsWithBadges(userId: string) {
  let items = getOrganizerNavItemsWithBadges(userId);
  const inboxUnread = getLocalOrganizerInboxUnreadCount(userId);

  if (isSupabaseBookingsEnabled()) {
    try {
      const res = await fetch("/api/notifications?scope=organizer&limit=1");
      if (res.ok) {
        const json = (await res.json()) as { unreadCount?: number };
        const hubUnread = json.unreadCount ?? 0;
        const combinedInboxBadge = inboxUnread + hubUnread;
        items = items.map((item) => {
          if (item.id === "dashboard") {
            return combinedInboxBadge > 0
              ? { ...item, badge: combinedInboxBadge }
              : { ...item, badge: undefined };
          }
          return item;
        });
        return items;
      }
    } catch {
      // local fallback already in getOrganizerNavItemsWithBadges
    }
  }

  return items;
}

function useOrganizerNavBadges() {
  const { user } = useAuth();
  const [navItems, setNavItems] = useState(ORGANIZER_NAV_ITEMS);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    async function refreshNavBadges() {
      setNavItems(await loadOrganizerNavItemsWithBadges(userId));
    }

    void refreshNavBadges();
    const handler = () => void refreshNavBadges();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, handler);
    window.addEventListener(MESSAGES_UPDATED_EVENT, handler);
    window.addEventListener(ORGANIZER_INBOX_UPDATED_EVENT, handler);
    window.addEventListener(NOTIFICATIONS_HUB_UPDATED_EVENT, handler);
    return () => {
      window.removeEventListener(BOOKINGS_UPDATED_EVENT, handler);
      window.removeEventListener(MESSAGES_UPDATED_EVENT, handler);
      window.removeEventListener(ORGANIZER_INBOX_UPDATED_EVENT, handler);
      window.removeEventListener(NOTIFICATIONS_HUB_UPDATED_EVENT, handler);
    };
  }, [user]);

  return navItems;
}

export default function OrganizerSidebar({
  userName = "Организатор",
  avatarUrl,
  forceCompact = false,
}: OrganizerSidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const navItems = useOrganizerNavBadges();
  const isSettingsActive = pathname.startsWith("/organizer/settings");

  const isCompact = forceCompact || collapsed;

  useEffect(() => {
    function syncCollapsedState() {
      if (window.innerWidth <= AUTO_COLLAPSE_MAX_WIDTH) {
        setCollapsed(true);
        return;
      }
      setCollapsed(readCollapsedPreference());
    }

    syncCollapsedState();
    setHydrated(true);

    window.addEventListener("resize", syncCollapsedState, { passive: true });
    return () => window.removeEventListener("resize", syncCollapsedState);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      writeCollapsedPreference(next);
      return next;
    });
  }

  if (!hydrated) {
    return (
      <div className="hidden w-[248px] shrink-0 md:block">
        <aside className={cn(cabinetSidebarSkeletonClass, "w-[248px]")} />
      </div>
    );
  }

  return (
    <aside
      className={cn(cabinetSidebarClass, isCompact ? "w-[72px]" : "w-[248px]")}
    >
      <div
        className={cn(
          "shrink-0 border-b",
          cabinetBorderDividerClass,
          isCompact ? "px-2.5 py-4" : "px-4 py-5"
        )}
      >
        {isCompact ? (
          <div className="flex flex-col items-center gap-3">
            <UserAvatar name={userName} avatarUrl={avatarUrl} className="h-10 w-10 text-sm" />
            <NotificationsBell scope="organizer" compact />
            <Link
              href="/organizer/settings"
              title="Управление"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                isSettingsActive
                  ? "border-sky/30 bg-sky/10 text-sky"
                  : cn(cabinetMutedSurfaceClass, "text-muted hover:text-foreground")
              )}
            >
              <Settings className="h-4 w-4" strokeWidth={1.75} />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <UserAvatar name={userName} avatarUrl={avatarUrl} className="h-11 w-11 text-sm" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-slate">Автор тура</p>
                <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
              </div>
              <NotificationsBell scope="organizer" />
            </div>
            <Link
              href="/organizer/settings"
              className={cn(
                "mt-4 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                isSettingsActive
                  ? "border-sky/30 bg-sky/10 text-sky"
                  : cn(cabinetMutedSurfaceClass, "text-foreground hover:bg-surface-muted")
              )}
            >
              <Settings className="h-4 w-4" strokeWidth={1.75} />
              Управление
            </Link>
          </>
        )}
      </div>

      <nav
        className={cn(
          "shrink-0 space-y-1",
          isCompact ? "px-2 py-3" : "px-3 py-4"
        )}
      >
        {navItems.map((item) => {
          const Icon = NAV_ICONS[item.id];
          const active =
            item.href === "/organizer"
              ? pathname === "/organizer"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              title={isCompact ? item.label : undefined}
              aria-label={item.label}
              className={cn(
                cabinetNavLinkClass,
                "flex items-center rounded-xl text-sm font-medium transition-colors",
                isCompact ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                active ? cabinetNavActiveClass : cabinetNavIdleClass
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
              {!isCompact ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
              {item.badge ? (
                <span
                  className={cn(
                    cabinetNavBadgeClass,
                    isCompact
                      ? "absolute -right-0.5 -top-0.5 h-4 min-w-4 px-0.5 text-[9px]"
                      : "h-5 min-w-5 px-1 text-[10px]"
                  )}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {!isCompact ? (
        <div className={cn("shrink-0 space-y-2 border-t px-4 py-4 text-[11px] leading-relaxed text-muted", cabinetBorderDividerClass)}>
          <p>© Пора в Аргентину, {new Date().getFullYear()}</p>
          <div className="space-y-1">
            {SITE_LEGAL_LINKS.slice(0, 2).map((link) => (
              <Link key={link.href} href={link.href} className="block transition-colors hover:text-sky">
                {link.label}
              </Link>
            ))}
            <Link href="/join" className="block transition-colors hover:text-sky">
              Договор для организаторов
            </Link>
          </div>
        </div>
      ) : null}

      {!forceCompact ? (
        <div className={cn("shrink-0 border-t", cabinetBorderDividerClass, isCompact ? "p-2" : "px-3 py-3")}>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!isCompact}
            aria-label={isCompact ? "Развернуть меню" : "Свернуть меню"}
            className={cn(
              cabinetSurfaceButtonClass,
              "flex w-full items-center",
              isCompact ? "justify-center p-2" : "gap-2 px-3 py-2 text-sm font-medium"
            )}
          >
            {isCompact ? (
              <ChevronRight className="h-4 w-4 shrink-0" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span>Свернуть</span>
              </>
            )}
          </button>
        </div>
      ) : null}
    </aside>
  );
}

export function OrganizerMobileHeader() {
  return (
    <div className={cabinetMobileHeaderClass}>
      <Link href="/" className="inline-flex">
        <ArgentinaLogo size="sm" />
      </Link>
      <p className="text-sm font-semibold text-foreground">Кабинет организатора</p>
      <Link href="/organizer/settings" className="text-xs font-medium text-sky">
        Управление
      </Link>
    </div>
  );
}

export function OrganizerMobileNav() {
  const pathname = usePathname();
  const navItems = useOrganizerNavBadges();

  return (
    <nav className={cabinetMobileNavClass}>
      {navItems.map((item) => {
        const Icon = NAV_ICONS[item.id];
        const active =
          item.href === "/organizer"
            ? pathname === "/organizer"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              cabinetNavLinkClass,
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active ? cn(cabinetNavActiveClass, "before:hidden") : cabinetNavIdleClass
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            {item.label}
            {item.badge ? (
              <span className={cn(cabinetNavBadgeClass, "ml-0.5 h-4 min-w-4 px-1 text-[9px]")}>
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
