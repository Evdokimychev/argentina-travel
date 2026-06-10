"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Heart,
  LayoutGrid,
  Mail,
  Settings,
  Star,
} from "lucide-react";
import UserAvatar from "@/components/auth/UserAvatar";
import { cn } from "@/lib/cn";
import { PROFILE_NAV_ITEMS, type ProfileNavId } from "@/data/tourist-dashboard";
import { useAuth } from "@/context/AuthContext";
import { getUnreadMessagesCount } from "@/lib/messages-store";
import { MESSAGES_UPDATED_EVENT } from "@/types/messages";

const NAV_ICONS: Record<ProfileNavId, typeof LayoutGrid> = {
  dashboard: LayoutGrid,
  favorites: Heart,
  bookings: CalendarDays,
  messages: Mail,
  reviews: Star,
  settings: Settings,
};

interface ProfileSidebarProps {
  userName: string;
  avatarUrl?: string | null;
}

export default function ProfileSidebar({ userName, avatarUrl }: ProfileSidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) return;

    function refresh() {
      setUnreadMessages(getUnreadMessagesCount({ userId: user!.id, role: "tourist" }));
    }

    refresh();
    window.addEventListener(MESSAGES_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(MESSAGES_UPDATED_EVENT, refresh);
  }, [user]);

  return (
    <div>
      <div className="mb-4 hidden rounded-2xl bg-gray-50 p-4 md:block">
        <div className="flex items-center gap-3">
          <UserAvatar name={userName} avatarUrl={avatarUrl} className="h-11 w-11 text-sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-charcoal">{userName}</p>
            <p className="text-xs text-slate">Турист</p>
          </div>
        </div>
      </div>

      <nav
        aria-label="Навигация кабинета"
        className="scrollbar-hide flex gap-2 overflow-x-auto md:block md:space-y-1 md:overflow-visible"
      >
        {PROFILE_NAV_ITEMS.map((item) => {
          const Icon = NAV_ICONS[item.id];
          const active =
            item.href === "/profile"
              ? pathname === "/profile"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "relative inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors md:flex md:w-full",
                active
                  ? "bg-brand-light text-charcoal"
                  : "text-slate hover:bg-gray-50 hover:text-charcoal"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {item.label}
              {item.id === "messages" && unreadMessages > 0 ? (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                  {unreadMessages}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function ProfileMobileHeader({ userName }: { userName: string }) {
  return (
    <div className="border-b border-gray-200 bg-white px-4 py-4 md:hidden">
      <h1 className="font-display text-xl font-bold text-charcoal">{userName}</h1>
      <p className="text-sm text-slate">Личный кабинет</p>
    </div>
  );
}
