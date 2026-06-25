"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAdminApi } from "@/hooks/useAdminApi";
import { cn } from "@/lib/cn";
import type { AdminNotificationItem } from "@/types/admin-notifications";

type NotificationsResponse = {
  notifications?: AdminNotificationItem[];
  unreadCount?: number;
};

function formatWhen(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminNotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  const { data, error, refresh } = useAdminApi<NotificationsResponse>("/api/admin/notifications");

  useEffect(() => {
    setItems(data?.notifications ?? []);
    setUnreadCount(data?.unreadCount ?? 0);
  }, [data]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refresh();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (open) {
      void refresh();
    }
  }, [open, refresh]);

  async function markOneRead(item: AdminNotificationItem) {
    if (item.readAt) return;

    const res = await fetch(`/api/admin/notifications/${item.id}/read`, { method: "PATCH" });
    if (!res.ok) return;

    setItems((prev) =>
      prev.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              readAt: new Date().toISOString(),
            }
          : entry
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  async function markAllAsRead() {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      const res = await fetch("/api/admin/notifications/mark-all-read", { method: "POST" });
      if (!res.ok) return;
      const readAt = new Date().toISOString();
      setItems((prev) => prev.map((entry) => ({ ...entry, readAt: entry.readAt ?? readAt })));
      setUnreadCount(0);
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-slate transition-colors hover:bg-gray-50 hover:text-charcoal"
          aria-label="Уведомления админ-панели"
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
              {unreadCount > 0 ? `${unreadCount} непрочитанных` : "Нет новых"}
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

        {items.length > 0 ? (
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
                !item.readAt && "bg-sky/5"
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
          <p className="px-4 py-6 text-sm text-slate">Пока нет уведомлений по модерации, лидам и оплатам.</p>
        )}

        {error ? <p className="border-t border-gray-100 px-4 py-2 text-xs text-red-600">{error}</p> : null}
      </PopoverContent>
    </Popover>
  );
}
