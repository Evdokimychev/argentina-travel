"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarClock,
  CreditCard,
  Inbox,
  MessageSquareQuote,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { cn } from "@/lib/cn";
import { cabinetLinkClass, cabinetPanelClass } from "@/lib/cabinet-ui";
import {
  apiFetchOrganizerInbox,
  apiMarkOrganizerInboxRead,
  getLocalOrganizerInbox,
  markLocalOrganizerInboxRead,
  ORGANIZER_INBOX_UPDATED_EVENT,
} from "@/lib/organizer-inbox";
import { BOOKINGS_UPDATED_EVENT, REVIEWS_UPDATED_EVENT } from "@/types/tourist";
import type { OrganizerInboxFilter, OrganizerInboxItem } from "@/types/organizer-inbox";

const FILTERS: Array<{ id: OrganizerInboxFilter; label: string }> = [
  { id: "all", label: "Все" },
  { id: "unread", label: "Непрочитанные" },
  { id: "bookings", label: "Заявки" },
  { id: "reviews", label: "Отзывы" },
  { id: "payments", label: "Оплата" },
];

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function itemIcon(type: OrganizerInboxItem["type"]) {
  switch (type) {
    case "new_booking":
      return Inbox;
    case "booking_status_change":
      return CalendarClock;
    case "new_review":
    case "review_reply_needed":
      return Star;
    case "payment_update":
      return CreditCard;
    case "tour_moderation":
      return MessageSquareQuote;
    default:
      return Bell;
  }
}

interface OrganizerInboxViewProps {
  compact?: boolean;
}

export default function OrganizerInboxView({ compact = false }: OrganizerInboxViewProps) {
  const { user } = useAuth();
  const [filter, setFilter] = useState<OrganizerInboxFilter>("all");
  const [items, setItems] = useState<OrganizerInboxItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const remoteEnabled = isSupabaseBookingsEnabled();

  const refresh = useCallback(async () => {
    if (!user) return;

    if (remoteEnabled) {
      try {
        const data = await apiFetchOrganizerInbox(filter);
        setItems(data.items);
        setUnreadCount(data.unreadCount);
        return;
      } catch {
        // fallback to local
      }
    }

    const local = getLocalOrganizerInbox(user.id, filter);
    setItems(local.items);
    setUnreadCount(local.unreadCount);
  }, [user, filter, remoteEnabled]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    void refresh().finally(() => setLoading(false));
  }, [user, refresh]);

  useEffect(() => {
    if (!user) return;

    function handleUpdate() {
      void refresh();
    }

    window.addEventListener(ORGANIZER_INBOX_UPDATED_EVENT, handleUpdate);
    window.addEventListener(BOOKINGS_UPDATED_EVENT, handleUpdate);
    window.addEventListener(REVIEWS_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(ORGANIZER_INBOX_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(BOOKINGS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(REVIEWS_UPDATED_EVENT, handleUpdate);
    };
  }, [user, refresh]);

  const visibleUnread = useMemo(
    () => items.filter((item) => !item.readAt).length,
    [items]
  );

  async function handleMarkRead(item: OrganizerInboxItem) {
    if (!user || item.readAt) return;

    if (remoteEnabled) {
      try {
        await apiMarkOrganizerInboxRead(item.itemKey);
      } catch {
        markLocalOrganizerInboxRead(user.id, item.itemKey);
      }
    } else {
      markLocalOrganizerInboxRead(user.id, item.itemKey);
    }

    setItems((prev) =>
      prev.map((entry) =>
        entry.itemKey === item.itemKey
          ? { ...entry, readAt: new Date().toISOString() }
          : entry
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    window.dispatchEvent(new CustomEvent(ORGANIZER_INBOX_UPDATED_EVENT));
  }

  async function handleMarkAllRead() {
    if (!user || unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      const unreadKeys = items.filter((item) => !item.readAt).map((item) => item.itemKey);
      if (remoteEnabled) {
        await fetch("/api/organizer/inbox", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markAll: true }),
        });
      } else {
        for (const key of unreadKeys) {
          markLocalOrganizerInboxRead(user.id, key);
        }
      }
      const readAt = new Date().toISOString();
      setItems((prev) => prev.map((item) => ({ ...item, readAt: item.readAt ?? readAt })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent(ORGANIZER_INBOX_UPDATED_EVENT));
    } finally {
      setMarkingAll(false);
    }
  }

  if (!user) return null;

  return (
    <section className={cabinetPanelClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky/10 text-sky">
            <Inbox className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-heading text-lg font-bold text-charcoal">Входящие</h2>
            <p className="text-xs text-slate">
              {unreadCount > 0
                ? `${unreadCount} непрочитанных`
                : "Нет новых событий"}
            </p>
          </div>
        </div>
        {unreadCount > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={markingAll}
            onClick={() => void handleMarkAllRead()}
          >
            {markingAll ? "Отмечаем…" : "Прочитать все"}
          </Button>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setFilter(entry.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              filter === entry.id
                ? "bg-sky text-white"
                : "bg-gray-100 text-slate hover:bg-gray-200"
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className={cn("mt-4", compact ? "max-h-[420px] overflow-y-auto" : "")}>
        {loading ? (
          <p className="py-8 text-center text-sm text-slate">Загружаем входящие…</p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Пока пусто"
            description="Здесь появятся новые заявки, отзывы и обновления оплаты."
          />
        ) : (
          <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100">
            {items.map((item) => {
              const Icon = itemIcon(item.type);
              return (
                <li key={item.itemKey}>
                  <Link
                    href={item.href}
                    onClick={() => void handleMarkRead(item)}
                    className={cn(
                      "flex gap-3 px-4 py-3 transition-colors hover:bg-gray-50",
                      !item.readAt && "bg-sky/5"
                    )}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-sky shadow-sm ring-1 ring-gray-100">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-charcoal">{item.title}</span>
                        {!item.readAt ? (
                          <span className="rounded-full bg-sky/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky">
                            Новое
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate">
                        {item.body}
                      </span>
                      <span className="mt-1 block text-[11px] text-slate/80">
                        {formatWhen(item.createdAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!compact && visibleUnread > 0 ? (
        <p className="mt-3 text-xs text-slate">
          Нажмите на событие, чтобы перейти к заявке, отзыву или туру и отметить его прочитанным.
        </p>
      ) : null}

      {!compact ? (
        <Link href="/organizer/bookings" className={cn(cabinetLinkClass, "mt-3 inline-flex text-xs")}>
          Все заявки →
        </Link>
      ) : null}
    </section>
  );
}
