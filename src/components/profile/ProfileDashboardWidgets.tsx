"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CalendarDays, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isSupabaseAuthEnabled, isSupabaseReviewsEnabled } from "@/lib/auth-mode";
import {
  getTouristDashboardOverview,
  getNextUpcomingBooking,
  getPendingReviewsCount,
} from "@/lib/tourist-dashboard";
import { getUserBookings } from "@/lib/bookings-store";
import { getUnreadNotificationsCount, NOTIFICATIONS_UPDATED_EVENT } from "@/lib/notifications";
import { apiFetchNotifications, NOTIFICATIONS_HUB_UPDATED_EVENT } from "@/lib/notifications/notifications-api";
import { formatBookingTourDates } from "@/lib/booking-display";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import { BOOKINGS_UPDATED_EVENT, REVIEWS_UPDATED_EVENT, type Booking, type TouristReview } from "@/types/tourist";
import { cn } from "@/lib/cn";
import { cabinetLinkClass, cabinetWidgetCardClass } from "@/lib/cabinet-ui";

function WidgetShell({
  title,
  icon: Icon,
  href,
  children,
  toneClass,
}: {
  title: string;
  icon: typeof Bell;
  href: string;
  children: React.ReactNode;
  toneClass: string;
}) {
  return (
    <Link href={href} className={cn(cabinetWidgetCardClass, "block", toneClass)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">{title}</p>
          <div className="mt-2">{children}</div>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-sky dark:bg-surface-muted/50">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
      </div>
    </Link>
  );
}

export default function ProfileDashboardWidgets() {
  const { user } = useAuth();
  const [nextBooking, setNextBooking] = useState<Booking | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const remoteNotifications = isSupabaseAuthEnabled();
  const remoteReviews = isSupabaseReviewsEnabled();

  const refresh = useCallback(async () => {
    if (!user) return;

    const bookings = getUserBookings(user.id);
    setNextBooking(getNextUpcomingBooking(user.id));

    if (remoteNotifications) {
      try {
        const data = await apiFetchNotifications("tourist", 1);
        setUnreadCount(data.unreadCount);
      } catch {
        setUnreadCount(
          getUnreadNotificationsCount({ userId: user.id, contactEmail: user.email })
        );
      }
    } else {
      setUnreadCount(
        getUnreadNotificationsCount({ userId: user.id, contactEmail: user.email })
      );
    }

    if (remoteReviews) {
      try {
        const res = await fetch("/api/reviews", { cache: "no-store" });
        if (res.ok) {
          const json = (await res.json()) as { reviews?: TouristReview[] };
          setPendingReviewsCount(
            getPendingReviewsCount(user.id, bookings, json.reviews ?? [])
          );
          return;
        }
      } catch {
        // fallback below
      }
    }

    const overview = getTouristDashboardOverview({
      userId: user.id,
      contactEmail: user.email,
    });
    setPendingReviewsCount(overview.pendingReviewsCount);
  }, [user, remoteNotifications, remoteReviews]);

  useEffect(() => {
    if (!user) return;
    void refresh();
  }, [user, refresh]);

  useEffect(() => {
    if (!user) return;

    function handleUpdate() {
      void refresh();
    }

    window.addEventListener(BOOKINGS_UPDATED_EVENT, handleUpdate);
    window.addEventListener(REVIEWS_UPDATED_EVENT, handleUpdate);
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdate);
    window.addEventListener(NOTIFICATIONS_HUB_UPDATED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(BOOKINGS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(REVIEWS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(NOTIFICATIONS_HUB_UPDATED_EVENT, handleUpdate);
    };
  }, [user, refresh]);

  if (!user) return null;

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <WidgetShell
        title="Ближайшая поездка"
        icon={CalendarDays}
        href={nextBooking ? `/profile/bookings/${nextBooking.id}` : "/profile/bookings"}
        toneClass="border-sky/15 bg-sky/[0.04] dark:bg-sky/[0.06]"
      >
        {nextBooking ? (
          <>
            <p className="truncate font-heading text-base font-bold text-foreground">
              {nextBooking.tourTitle}
            </p>
            <p className="mt-1 text-xs text-muted">
              {nextBooking.startDate
                ? formatBookingTourDates(nextBooking, "Дата по запросу")
                : "Дата по запросу"}
            </p>
            <div className="mt-2">
              <BookingStatusBadge status={nextBooking.status} />
            </div>
          </>
        ) : (
          <>
            <p className="font-heading text-2xl font-bold text-foreground">—</p>
            <p className="mt-1 text-xs text-muted">Нет активных поездок</p>
            <span className={cn(cabinetLinkClass, "mt-2 inline-flex text-xs")}>
              Выбрать тур →
            </span>
          </>
        )}
      </WidgetShell>

      <WidgetShell
        title="Непрочитанные"
        icon={Bell}
        href="#notifications"
        toneClass="border-amber-100/80 bg-amber-50/40 dark:border-amber-900/30 dark:bg-amber-950/20"
      >
        <p className="font-heading text-3xl font-bold text-foreground">{unreadCount}</p>
        <p className="mt-1 text-xs text-muted">
          {unreadCount > 0 ? "Новые уведомления" : "Всё прочитано"}
        </p>
      </WidgetShell>

      <WidgetShell
        title="Отзывы к написанию"
        icon={Star}
        href="/profile/reviews"
        toneClass="border-violet-100/80 bg-violet-50/40 dark:border-violet-900/30 dark:bg-violet-950/20"
      >
        <p className="font-heading text-3xl font-bold text-foreground">{pendingReviewsCount}</p>
        <p className="mt-1 text-xs text-muted">
          {pendingReviewsCount > 0
            ? "Поездки ждут ваш отзыв"
            : "Нет ожидающих отзывов"}
        </p>
      </WidgetShell>
    </section>
  );
}
