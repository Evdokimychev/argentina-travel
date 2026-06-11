"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_UPDATED_EVENT,
  type AppNotification,
} from "@/lib/notifications";
import { cn } from "@/lib/cn";

function NotificationItem({
  item,
  onRead,
}: {
  item: AppNotification;
  onRead: (id: string) => void;
}) {
  const content = (
    <>
      <p className={cn("text-sm font-medium", item.read ? "text-slate" : "text-charcoal")}>
        {item.title}
      </p>
      <p className="mt-0.5 text-xs leading-relaxed text-slate">{item.body}</p>
      <p className="mt-1 text-[11px] text-slate/80">
        {new Intl.DateTimeFormat("ru-RU", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(item.createdAt))}
      </p>
    </>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        onClick={() => onRead(item.id)}
        className={cn(
          "block rounded-xl px-4 py-3 transition-colors hover:bg-gray-50",
          !item.read && "bg-brand-light/20 ring-1 ring-brand/10"
        )}
      >
        {content}
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl px-4 py-3",
        !item.read && "bg-brand-light/20 ring-1 ring-brand/10"
      )}
    >
      {content}
    </div>
  );
}

export default function ProfileNotifications({ limit }: { limit?: number }) {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) return;

    function refresh() {
      setItems(getNotificationsForUser({ userId: user!.id, contactEmail: user!.email, limit }));
    }

    refresh();
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
  }, [user, limit]);

  if (!user) return null;

  const unread = items.filter((item) => !item.read).length;

  function handleRead(id: string) {
    markNotificationRead(id);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-light text-brand">
            <Bell className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-heading text-lg font-bold text-charcoal">Уведомления</h3>
            {unread > 0 ? (
              <p className="text-xs text-slate">{unread} непрочитанных</p>
            ) : (
              <p className="text-xs text-slate">Нет новых</p>
            )}
          </div>
        </div>
        {unread > 0 ? (
          <button
            type="button"
            onClick={() => {
              markAllNotificationsRead({ userId: user.id, contactEmail: user.email });
              setItems((prev) => prev.map((item) => ({ ...item, read: true })));
            }}
            className="text-xs font-medium text-brand hover:underline"
          >
            Прочитать все
          </button>
        ) : null}
      </div>

      {items.length > 0 ? (
        <ul className="mt-4 divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.id}>
              <NotificationItem item={item} onRead={handleRead} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-slate">
          Здесь появятся сообщения о заявках, оплате и заполнении данных участников.
        </p>
      )}
    </section>
  );
}
