"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
import { cn } from "@/lib/cn";
import { ORGANIZER_NAV_ITEMS, type OrganizerNavId } from "@/data/organizer-dashboard";
import { useAuth } from "@/context/AuthContext";
import { getOrganizerNavItemsWithBadges } from "@/lib/organizer-bookings";
import { BOOKINGS_UPDATED_EVENT } from "@/types/tourist";

const SIDEBAR_COLLAPSED_KEY = "organizer-sidebar-collapsed";
/** Ниже этой ширины окна сайдбар сворачивается автоматически */
const AUTO_COLLAPSE_MAX_WIDTH = 1279;

const NAV_ICONS: Record<OrganizerNavId, typeof LayoutGrid> = {
  dashboard: LayoutGrid,
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

export default function OrganizerSidebar({
  userName = "Организатор",
  avatarUrl,
  forceCompact = false,
}: OrganizerSidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [navItems, setNavItems] = useState(ORGANIZER_NAV_ITEMS);
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

  useEffect(() => {
    if (!user) return;

    function refreshNavBadges() {
      setNavItems(getOrganizerNavItemsWithBadges(user!.id));
    }

    refreshNavBadges();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, refreshNavBadges);
    return () => window.removeEventListener(BOOKINGS_UPDATED_EVENT, refreshNavBadges);
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
        <aside className="sticky top-[calc(var(--site-header-height,72px)+1rem)] h-fit w-[248px] rounded-3xl border border-gray-200 bg-white shadow-sm" />
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "sticky top-[calc(var(--site-header-height,72px)+1rem)] hidden h-fit max-h-[calc(100vh-var(--site-header-height,72px)-2rem)] shrink-0 flex-col overflow-y-auto rounded-3xl border border-gray-200 bg-white shadow-sm transition-[width] duration-300 ease-out md:flex",
        isCompact ? "w-[72px]" : "w-[248px]"
      )}
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
            <Link
              href="/organizer/settings"
              title="Управление"
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
              <div className="min-w-0">
                <p className="text-[11px] text-slate">Автор тура</p>
                <p className="truncate text-sm font-semibold text-charcoal">{userName}</p>
              </div>
            </div>
            <Link
              href="/organizer/settings"
              className={cn(
                "mt-4 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                isSettingsActive
                  ? "border-sky/30 bg-sky/10 text-sky"
                  : "border-gray-200 bg-gray-50 text-charcoal hover:bg-gray-100"
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
                "relative flex items-center rounded-xl text-sm font-medium transition-colors",
                isCompact ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                active
                  ? "bg-sky/10 text-sky"
                  : "text-slate hover:bg-gray-50 hover:text-charcoal"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
              {!isCompact ? <span className="min-w-0 flex-1 truncate">{item.label}</span> : null}
              {item.badge ? (
                <span
                  className={cn(
                    "flex items-center justify-center rounded-full bg-brand font-bold text-white",
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
            <Link href="/contacts" className="block transition-colors hover:text-brand">
              Публичная оферта
            </Link>
            <Link href="/contacts" className="block transition-colors hover:text-brand">
              Политика конфиденциальности
            </Link>
            <Link href="/join" className="block transition-colors hover:text-brand">
              Договор для организаторов
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

export function OrganizerMobileHeader() {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
      <Link href="/" className="inline-flex">
        <ArgentinaLogo size="sm" />
      </Link>
      <p className="text-sm font-semibold text-charcoal">Кабинет организатора</p>
      <Link href="/organizer/settings" className="text-xs font-medium text-brand">
        Управление
      </Link>
    </div>
  );
}

export function OrganizerMobileNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [navItems, setNavItems] = useState(ORGANIZER_NAV_ITEMS);

  useEffect(() => {
    if (!user) return;

    function refreshNavBadges() {
      setNavItems(getOrganizerNavItemsWithBadges(user!.id));
    }

    refreshNavBadges();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, refreshNavBadges);
    return () => window.removeEventListener(BOOKINGS_UPDATED_EVENT, refreshNavBadges);
  }, [user]);

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 bg-white px-3 py-2 md:hidden scrollbar-hide">
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
              "relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active ? "bg-sky/10 text-sky" : "text-slate hover:bg-gray-50"
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            {item.label}
            {item.badge ? (
              <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
