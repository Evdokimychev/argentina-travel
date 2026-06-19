"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import {
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_UPDATED_EVENT,
  type AppNotification,
} from "@/lib/notifications";
import {
  apiFetchNotifications,
  apiMarkNotificationRead,
  NOTIFICATIONS_HUB_UPDATED_EVENT,
} from "@/lib/notifications/notifications-api";
import { cn } from "@/lib/cn";
import { cabinetLinkClass, cabinetPanelClass } from "@/lib/cabinet-ui";
import type { UnifiedNotificationItem } from "@/types/notifications-hub";

function NotificationItem({
  item,
  onRead,
}: {
  item: UnifiedNotificationItem;
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
          !item.read && "bg-sky/5 ring-1 ring-sky/15"
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
        !item.read && "bg-sky/5 ring-1 ring-sky/15"
      )}
    >
      {content}
    </div>
  );
}

function mapLocalNotification(item: AppNotification): UnifiedNotificationItem {
  return {
    id: item.id,
    source: "system",
    category: item.category,
    title: item.title,
    body: item.body,
    href: item.href,
    read: item.read,
    createdAt: item.createdAt,
  };
}

export default function ProfileNotifications({ limit }: { limit?: number }) {
  const { user } = useAuth();
  const [items, setItems] = useState<UnifiedNotificationItem[]>([]);
  const remoteEnabled = isSupabaseAuthEnabled();

  const refresh = useCallback(async () => {
    if (!user) return;

    if (remoteEnabled) {
      try {
        const data = await apiFetchNotifications("tourist", limit ?? 20);
        setItems(data.items);
        return;
      } catch {
        // fallback
      }
    }

    setItems(
      getNotificationsForUser({ userId: user.id, contactEmail: user.email, limit }).map(
        mapLocalNotification
      )
    );
  }, [user, limit, remoteEnabled]);

  useEffect(() => {
    if (!user) return;
    void refresh();
  }, [user, refresh]);

  useEffect(() => {
    if (!user) return;

    function handleUpdate() {
      void refresh();
    }

    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdate);
    window.addEventListener(NOTIFICATIONS_HUB_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(NOTIFICATIONS_HUB_UPDATED_EVENT, handleUpdate);
    };
  }, [user, refresh]);

  async function handleRead(id: string) {
    if (remoteEnabled) {
      try {
        await apiMarkNotificationRead({ id, scope: "tourist" });
      } catch {
        return;
      }
    } else {
      markNotificationRead(id);
    }
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }

  async function handleReadAll() {
    if (!user) return;
    if (remoteEnabled) {
      try {
        await apiMarkNotificationRead({ markAll: true, scope: "tourist" });
      } catch {
        return;
      }
    } else {
      markAllNotificationsRead({ userId: user.id, contactEmail: user.email });
    }
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  }

  if (!user) return null;

  const unread = items.filter((item) => !item.read).length;

  return (
    <section className={cabinetPanelClass}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky/10 text-sky">
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
          <button type="button" onClick={() => void handleReadAll()} className={cn(cabinetLinkClass, "text-xs")}>
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
          Здесь появятся сообщения о заявках, оплате, отзывах и заполнении данных участников.
        </p>
      )}
    </section>
  );
}
