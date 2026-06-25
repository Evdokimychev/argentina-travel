"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EmptyState } from "@/components/ui/empty-state";
import { CabinetInboxListSkeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { cn } from "@/lib/cn";
import {
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_UPDATED_EVENT,
} from "@/lib/notifications";
import {
  apiFetchNotifications,
  apiMarkNotificationRead,
  NOTIFICATIONS_HUB_UPDATED_EVENT,
} from "@/lib/notifications/notifications-api";
import { ORGANIZER_INBOX_UPDATED_EVENT } from "@/types/organizer-inbox";
import type { NotificationScope, UnifiedNotificationItem } from "@/types/notifications-hub";
import { BOOKINGS_UPDATED_EVENT, REVIEWS_UPDATED_EVENT } from "@/types/tourist";

function formatWhen(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

interface NotificationsBellProps {
  scope: NotificationScope;
  compact?: boolean;
  className?: string;
}

export default function NotificationsBell({
  scope,
  compact = false,
  className,
}: NotificationsBellProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<UnifiedNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const remoteEnabled = isSupabaseAuthEnabled();

  const refresh = useCallback(async () => {
    if (!user) return;

    if (remoteEnabled) {
      try {
        const data = await apiFetchNotifications(scope, 15);
        setItems(data.items);
        setUnreadCount(data.unreadCount);
        return;
      } catch {
        // fallback below
      }
    }

    if (scope === "tourist") {
      const local = getNotificationsForUser({
        userId: user.id,
        contactEmail: user.email,
        limit: 15,
      }).map((item) => ({
        id: item.id,
        source: "system" as const,
        category: item.category,
        title: item.title,
        body: item.body,
        href: item.href,
        read: item.read,
        createdAt: item.createdAt,
      }));
      setItems(local);
      setUnreadCount(local.filter((item) => !item.read).length);
    }
  }, [user, scope, remoteEnabled]);

  useEffect(() => {
    if (!user) return;
    void refresh();
  }, [user, refresh]);

  useEffect(() => {
    if (!user) return;

    function handleUpdate() {
      void refresh();
    }

    window.addEventListener(NOTIFICATIONS_HUB_UPDATED_EVENT, handleUpdate);
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdate);
    window.addEventListener(ORGANIZER_INBOX_UPDATED_EVENT, handleUpdate);
    window.addEventListener(BOOKINGS_UPDATED_EVENT, handleUpdate);
    window.addEventListener(REVIEWS_UPDATED_EVENT, handleUpdate);

    const timer = window.setInterval(() => {
      void refresh();
    }, 60_000);

    return () => {
      window.removeEventListener(NOTIFICATIONS_HUB_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(ORGANIZER_INBOX_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(BOOKINGS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(REVIEWS_UPDATED_EVENT, handleUpdate);
      window.clearInterval(timer);
    };
  }, [user, refresh]);

  useEffect(() => {
    if (open) {
      setLoading(true);
      void refresh().finally(() => setLoading(false));
    }
  }, [open, refresh]);

  if (!user) return null;

  async function markOneRead(item: UnifiedNotificationItem) {
    if (item.read) return;

    if (remoteEnabled) {
      try {
        await apiMarkNotificationRead({
          id: item.id,
          itemKey: item.itemKey,
          scope,
        });
      } catch {
        return;
      }
    } else if (scope === "tourist") {
      markNotificationRead(item.id);
    }

    setItems((prev) =>
      prev.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  async function markAllAsRead() {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      if (remoteEnabled) {
        await apiMarkNotificationRead({ markAll: true, scope });
      } else if (scope === "tourist") {
        markAllNotificationsRead({ userId: user!.id, contactEmail: user!.email });
      }
      setItems((prev) => prev.map((entry) => ({ ...entry, read: true })));
      setUnreadCount(0);
    } finally {
      setMarkingAll(false);
    }
  }

  const settingsHref =
    scope === "organizer" ? "/organizer/settings?tab=notifications" : "/profile/settings#notifications";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative inline-flex items-center justify-center rounded-xl border border-gray-200 text-slate transition-colors hover:bg-gray-50 hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40",
            compact ? "h-9 w-9" : "h-10 w-10",
            className
          )}
          aria-label={
            unreadCount > 0 ? `Уведомления: ${unreadCount} непрочитанных` : "Уведомления"
          }
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <Bell className="h-4 w-4" aria-hidden />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-sky px-1 text-[11px] font-semibold leading-none text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0 sm:min-w-[360px] sm:max-w-[420px]">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-charcoal">Уведомления</p>
            <p className="text-xs text-slate">
              {loading
                ? "Загрузка…"
                : unreadCount > 0
                  ? `${unreadCount} непрочитанных`
                  : "Нет новых"}
            </p>
          </div>
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => void markAllAsRead()}
              disabled={markingAll}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-sky transition-colors hover:bg-sky/10 disabled:opacity-60"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              Прочитать все
            </button>
          ) : null}
        </div>

        {loading ? (
          <CabinetInboxListSkeleton count={4} compact className="border-0 rounded-none" />
        ) : items.length > 0 ? (
          <ul className="max-h-[400px] overflow-y-auto divide-y divide-gray-100">
            {items.map((item) => {
              const content = (
                <>
                  <p className="text-sm font-medium text-charcoal">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate">{item.body}</p>
                  <p className="mt-1 text-[11px] text-slate/80">{formatWhen(item.createdAt)}</p>
                </>
              );

              const className = cn(
                "block px-4 py-3 transition-colors hover:bg-gray-50",
                !item.read && "bg-sky/5"
              );

              if (item.href) {
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        void markOneRead(item);
                        setOpen(false);
                      }}
                      className={className}
                    >
                      {content}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => void markOneRead(item)}
                    className={cn(className, "w-full text-left")}
                  >
                    {content}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            variant="cabinet"
            compact
            bordered={false}
            icon={Bell}
            title="Уведомлений пока нет"
            description={
              scope === "organizer"
                ? "Здесь появятся заявки, отзывы, оплата и системные сообщения."
                : "Здесь появятся сообщения о заявках, оплате и отзывах."
            }
            action={{
              label: scope === "organizer" ? "Открыть заявки" : "Мои бронирования",
              href: scope === "organizer" ? "/organizer/bookings" : "/profile/bookings",
              variant: "outline",
            }}
          />
        )}

        <div className="border-t border-gray-100 px-4 py-2">
          <Link
            href={settingsHref}
            onClick={() => setOpen(false)}
            className="text-xs font-medium text-sky hover:text-sky-dark"
          >
            Настройки уведомлений
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
