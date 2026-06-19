"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Heart,
  LayoutGrid,
  Mail,
  Settings,
  ShoppingBag,
  Star,
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
  cabinetSidebarClass,
  cabinetSidebarSkeletonClass,
} from "@/lib/cabinet-ui";
import {
  PROFILE_NAV_ITEMS,
  PROFILE_SETTINGS_HREF,
  type ProfileNavId,
} from "@/data/tourist-dashboard";
import { useAuth } from "@/context/AuthContext";
import { getProfileNavItemsWithBadges } from "@/lib/tourist-nav";
import { BOOKINGS_UPDATED_EVENT } from "@/types/tourist";
import { MESSAGES_UPDATED_EVENT } from "@/types/messages";
import { SITE_LEGAL_LINKS } from "@/data/site-links";

const SIDEBAR_COLLAPSED_KEY = "profile-sidebar-collapsed";
const AUTO_COLLAPSE_MAX_WIDTH = 1279;

const NAV_ICONS: Record<Exclude<ProfileNavId, "settings">, typeof LayoutGrid> = {
  dashboard: LayoutGrid,
  favorites: Heart,
  bookings: CalendarDays,
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

export default function ProfileSidebar({
  userName,
  avatarUrl,
  forceCompact = false,
}: ProfileSidebarProps) {
  const { user } = useAuth();
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
    if (!user) return;

    function refreshNavBadges() {
      setNavItems(getProfileNavItemsWithBadges(user!.id));
    }

    refreshNavBadges();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, refreshNavBadges);
    window.addEventListener(MESSAGES_UPDATED_EVENT, refreshNavBadges);
    return () => {
      window.removeEventListener(BOOKINGS_UPDATED_EVENT, refreshNavBadges);
      window.removeEventListener(MESSAGES_UPDATED_EVENT, refreshNavBadges);
    };
  }, [user]);

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
          "shrink-0 border-b border-gray-100",
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
                  : "border-gray-200 bg-gray-50 text-slate hover:border-gray-300 hover:text-charcoal"
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
                <p className="truncate text-sm font-semibold text-charcoal">{userName}</p>
              </div>
              <NotificationsBell scope="tourist" />
            </div>
            <Link
              href={PROFILE_SETTINGS_HREF}
              className={cn(
                "mt-4 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                isSettingsActive
                  ? "border-sky/30 bg-sky/10 text-sky"
                  : "border-gray-200 bg-gray-50 text-charcoal hover:bg-gray-100"
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
          "shrink-0 space-y-1",
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
        <div className="shrink-0 space-y-2 border-t border-gray-100 px-4 py-4 text-[11px] leading-relaxed text-slate">
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
        <div className={cn("shrink-0 border-t border-gray-100", isCompact ? "p-2" : "px-3 py-3")}>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!isCompact}
            aria-label={isCompact ? "Развернуть меню" : "Свернуть меню"}
            className={cn(
              "flex w-full items-center rounded-xl border border-gray-200 bg-white text-slate transition-colors hover:bg-gray-50 hover:text-charcoal",
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
      <Link href="/" className="inline-flex">
        <ArgentinaLogo size="sm" />
      </Link>
      <p className="text-sm font-semibold text-charcoal">Личный кабинет</p>
      <Link href={PROFILE_SETTINGS_HREF} className="text-xs font-medium text-sky">
        Настройки
      </Link>
    </div>
  );
}

export function ProfileMobileNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [navItems, setNavItems] = useState(PROFILE_NAV_ITEMS);

  useEffect(() => {
    if (!user) return;

    function refreshNavBadges() {
      setNavItems(getProfileNavItemsWithBadges(user!.id));
    }

    refreshNavBadges();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, refreshNavBadges);
    window.addEventListener(MESSAGES_UPDATED_EVENT, refreshNavBadges);
    return () => {
      window.removeEventListener(BOOKINGS_UPDATED_EVENT, refreshNavBadges);
      window.removeEventListener(MESSAGES_UPDATED_EVENT, refreshNavBadges);
    };
  }, [user]);

  return (
    <nav className={cabinetMobileNavClass}>
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
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active ? cabinetNavActiveClass : cabinetNavIdleClass
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
