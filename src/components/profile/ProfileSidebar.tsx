"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Heart,
  LayoutGrid,
  Mail,
  MoreHorizontal,
  Settings,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";
import ArgentinaLogo from "@/components/ArgentinaLogo";
import UserAvatar from "@/components/auth/UserAvatar";
import NotificationsBell from "@/components/notifications/NotificationsBell";
import { cn } from "@/lib/cn";
import {
  cabinetMobileHeaderClass,
  cabinetMobileBottomNavClass,
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
import {
  PROFILE_NAV_ITEMS,
  PROFILE_SETTINGS_HREF,
  type ProfileNavId,
} from "@/data/tourist-dashboard";
import { useAuth } from "@/context/AuthContext";
import { getProfileNavItemsWithBadges } from "@/lib/tourist-nav";
import {
  apiFetchConversationUnreadCount,
  isRemoteMessagingMode,
} from "@/lib/conversations-api";
import { useConversationInboxRealtime } from "@/hooks/useConversationInboxRealtime";
import { BOOKINGS_UPDATED_EVENT } from "@/types/tourist";
import { MESSAGES_UPDATED_EVENT } from "@/types/messages";
import { SITE_LEGAL_LINKS } from "@/data/site-links";

const SIDEBAR_COLLAPSED_KEY = "profile-sidebar-collapsed";
const AUTO_COLLAPSE_MAX_WIDTH = 1279;
const PROFILE_MOBILE_PRIMARY_IDS: ProfileNavId[] = ["dashboard", "favorites", "bookings"];

const NAV_ICONS: Record<Exclude<ProfileNavId, "settings">, typeof LayoutGrid> = {
  dashboard: LayoutGrid,
  favorites: Heart,
  bookings: CalendarDays,
  tripPrep: ClipboardCheck,
  groupTrips: Users,
  orders: ShoppingBag,
  messages: Mail,
  reviews: Star,
};

interface ProfileSidebarProps {
  userName: string;
  avatarUrl?: string | null;
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

async function loadProfileNavItems(userId: string): Promise<ReturnType<typeof getProfileNavItemsWithBadges>> {
  if (!isRemoteMessagingMode()) {
    return getProfileNavItemsWithBadges(userId);
  }

  try {
    const unreadMessages = await apiFetchConversationUnreadCount("tourist");
    return getProfileNavItemsWithBadges(userId, { unreadMessages });
  } catch {
    return getProfileNavItemsWithBadges(userId);
  }
}

export default function ProfileSidebar({
  userName,
  avatarUrl,
  forceCompact = false,
}: ProfileSidebarProps) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [navItems, setNavItems] = useState(PROFILE_NAV_ITEMS);
  const isSettingsActive = pathname.startsWith(PROFILE_SETTINGS_HREF);

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

  useEffect(() => {
    if (!userId) return;
    const stableUserId = userId;

    async function refreshNavBadges() {
      setNavItems(await loadProfileNavItems(stableUserId));
    }

    void refreshNavBadges();
    const handler = () => void refreshNavBadges();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, handler);
    window.addEventListener(MESSAGES_UPDATED_EVENT, handler);
    return () => {
      window.removeEventListener(BOOKINGS_UPDATED_EVENT, handler);
      window.removeEventListener(MESSAGES_UPDATED_EVENT, handler);
    };
  }, [userId]);

  useConversationInboxRealtime(Boolean(userId && isRemoteMessagingMode()), () => {
    if (!userId) return;
    void loadProfileNavItems(userId).then(setNavItems);
  });

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
            <NotificationsBell scope="tourist" compact />
            <Link
              href={PROFILE_SETTINGS_HREF}
              title="Настройки"
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
                <p className="text-[11px] text-slate">Турист</p>
                <p className="truncate text-sm font-semibold text-foreground">{userName}</p>
              </div>
              <NotificationsBell scope="tourist" />
            </div>
            <Link
              href={PROFILE_SETTINGS_HREF}
              className={cn(
                "mt-4 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                isSettingsActive
                  ? "border-sky/30 bg-sky/10 text-sky"
                  : cn(cabinetMutedSurfaceClass, "text-foreground hover:bg-surface-muted")
              )}
            >
              <Settings className="h-4 w-4" strokeWidth={1.75} />
              Настройки
            </Link>
          </>
        )}
      </div>

      <nav
        className={cn(
          "min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain scrollbar-thin",
          isCompact ? "px-2 py-3" : "px-3 py-4"
        )}
      >
        {navItems.map((item) => {
          const Icon = NAV_ICONS[item.id as Exclude<ProfileNavId, "settings">];
          const active =
            item.href === "/profile"
              ? pathname === "/profile"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              title={isCompact ? item.label : undefined}
              aria-label={item.label}
              className={cn(
                "relative flex items-center rounded-xl text-sm font-medium transition-colors",
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
              <Link
                key={link.href}
                href={link.href}
                className="block transition-colors hover:text-sky"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/join" className="block transition-colors hover:text-sky">
              Стать организатором
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

export function ProfileMobileHeader() {
  return (
    <div className={cabinetMobileHeaderClass}>
      <Link href="/" className="inline-flex min-h-11 items-center">
        <ArgentinaLogo size="sm" />
      </Link>
      <p className="text-sm font-semibold text-charcoal">Личный кабинет</p>
      <Link href={PROFILE_SETTINGS_HREF} className="-mr-2 inline-flex min-h-11 items-center px-2 text-xs font-medium text-sky">
        Настройки
      </Link>
    </div>
  );
}

export function ProfileMobileNav() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const pathname = usePathname();
  const [navItems, setNavItems] = useState(PROFILE_NAV_ITEMS);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const stableUserId = userId;

    async function refreshNavBadges() {
      setNavItems(await loadProfileNavItems(stableUserId));
    }

    void refreshNavBadges();
    const handler = () => void refreshNavBadges();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, handler);
    window.addEventListener(MESSAGES_UPDATED_EVENT, handler);
    return () => {
      window.removeEventListener(BOOKINGS_UPDATED_EVENT, handler);
      window.removeEventListener(MESSAGES_UPDATED_EVENT, handler);
    };
  }, [userId]);

  useConversationInboxRealtime(Boolean(userId && isRemoteMessagingMode()), () => {
    if (!userId) return;
    void loadProfileNavItems(userId).then(setNavItems);
  });

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [moreOpen]);

  const primaryItems = navItems.filter((item) => PROFILE_MOBILE_PRIMARY_IDS.includes(item.id));
  const moreItems = navItems.filter((item) => !PROFILE_MOBILE_PRIMARY_IDS.includes(item.id));
  const isItemActive = (href: string) =>
    href === "/profile" ? pathname === "/profile" : pathname.startsWith(href);
  const isMoreActive =
    pathname.startsWith(PROFILE_SETTINGS_HREF) || moreItems.some((item) => isItemActive(item.href));
  const hasMoreBadge = moreItems.some((item) => (item.badge ?? 0) > 0);

  return (
    <>
    <nav className={cn(cabinetMobileBottomNavClass, "grid grid-cols-4 items-center")} aria-label="Навигация личного кабинета">
      {primaryItems.map((item) => {
        const Icon = NAV_ICONS[item.id as Exclude<ProfileNavId, "settings">];
        const active = isItemActive(item.href);

        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              cabinetNavLinkClass,
              "relative flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-semibold transition-colors",
              active ? "text-sky" : "text-slate hover:text-foreground",
            )}
          >
            <span className={cn("relative flex h-7 w-7 items-center justify-center rounded-lg", active ? "bg-sky/10 text-sky" : "bg-gray-100 text-slate")}>
            <Icon className="h-4 w-4" strokeWidth={1.85} />
            {item.badge ? (
              <span className={cn(cabinetNavBadgeClass, "absolute -right-1.5 -top-1 h-4 min-w-4 px-1 text-[9px]")}>
                {item.badge}
              </span>
            ) : null}
            </span>
            {item.label}
          </Link>
        );
      })}
      <button
        type="button"
        aria-expanded={moreOpen}
        aria-controls="profile-mobile-more-menu"
        aria-label="Ещё разделы"
        onClick={() => setMoreOpen((open) => !open)}
        className={cn(
          "relative flex min-h-11 min-w-11 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-semibold transition-colors",
          isMoreActive || moreOpen ? "text-sky" : "text-slate hover:text-foreground",
        )}
      >
        <span className={cn("relative flex h-7 w-7 items-center justify-center rounded-lg", isMoreActive || moreOpen ? "bg-sky/10 text-sky" : "bg-gray-100 text-slate")}>
          <MoreHorizontal className="h-4 w-4" strokeWidth={1.85} />
          {hasMoreBadge ? <span className={cn(cabinetNavBadgeClass, "absolute -right-1.5 -top-1 h-4 min-w-4 text-[9px]")}>•</span> : null}
        </span>
        Ещё
      </button>
    </nav>

    {moreOpen ? (
      <div className="fixed inset-0 z-30 md:hidden">
        <button type="button" aria-label="Закрыть дополнительные разделы" onClick={() => setMoreOpen(false)} className="absolute inset-0 bg-black/25" />
        <div id="profile-mobile-more-menu" role="dialog" aria-modal="true" aria-label="Дополнительные разделы личного кабинета" className="absolute inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] max-h-[calc(100dvh-6.5rem-env(safe-area-inset-bottom,0px))] overflow-y-auto overscroll-contain rounded-2xl border border-border-subtle bg-surface-elevated p-2 shadow-elevated">
          <div className="grid grid-cols-2 gap-2">
            {moreItems.map((item) => {
              const Icon = NAV_ICONS[item.id as Exclude<ProfileNavId, "settings">];
              const active = isItemActive(item.href);
              return (
                <Link key={item.id} href={item.href} aria-current={active ? "page" : undefined} onClick={() => setMoreOpen(false)} className={cn(cabinetSurfaceButtonClass, "flex items-center justify-between gap-2 px-3 py-2.5 text-sm", active && "border-sky/30 bg-sky/10 text-sky")}>
                  <span className="inline-flex items-center gap-2"><Icon className="h-4 w-4" strokeWidth={1.75} />{item.label}</span>
                  {item.badge ? <span className={cn(cabinetNavBadgeClass, "h-4 min-w-4 px-1 text-[9px]")}>{item.badge}</span> : null}
                </Link>
              );
            })}
            <Link href={PROFILE_SETTINGS_HREF} aria-current={pathname.startsWith(PROFILE_SETTINGS_HREF) ? "page" : undefined} onClick={() => setMoreOpen(false)} className={cn(cabinetSurfaceButtonClass, "flex items-center gap-2 px-3 py-2.5 text-sm", pathname.startsWith(PROFILE_SETTINGS_HREF) && "border-sky/30 bg-sky/10 text-sky")}>
              <Settings className="h-4 w-4" strokeWidth={1.75} />Настройки
            </Link>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}
