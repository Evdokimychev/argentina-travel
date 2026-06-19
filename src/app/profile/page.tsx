"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getRecentBookings, getTouristDashboardStats } from "@/lib/tourist-dashboard";
import { BOOKINGS_UPDATED_EVENT, FAVORITES_UPDATED_EVENT, REVIEWS_UPDATED_EVENT } from "@/types/tourist";
import { formatBookingTourDates } from "@/lib/booking-display";
import FormattedPrice from "@/components/FormattedPrice";
import BookingReviewCta from "@/components/profile/BookingReviewCta";
import ProfileNotifications from "@/components/profile/ProfileNotifications";
import ProfileDashboardWidgets from "@/components/profile/ProfileDashboardWidgets";
import ProfileQuickActions from "@/components/profile/ProfileQuickActions";
import PersonalizedRecommendationsSection from "@/components/personalization/PersonalizedRecommendationsSection";
import { buildTourMessageHref } from "@/lib/messages-store";
import { EmptyState } from "@/components/ui/empty-state";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import { cn } from "@/lib/cn";
import {
  cabinetHeroClass,
  cabinetLinkClass,
  cabinetPanelClass,
} from "@/lib/cabinet-ui";

export default function ProfileDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    tripsCount: 0,
    favoritesCount: 0,
    pendingBookingsCount: 0,
    reviewsCount: 0,
  });
  const [recentBookings, setRecentBookings] = useState<ReturnType<typeof getRecentBookings>>([]);

  useEffect(() => {
    if (!user) return;

    function refresh() {
      setStats(getTouristDashboardStats(user!.id));
      setRecentBookings(getRecentBookings(user!.id));
    }

    refresh();
    window.addEventListener(FAVORITES_UPDATED_EVENT, refresh);
    window.addEventListener(BOOKINGS_UPDATED_EVENT, refresh);
    window.addEventListener(REVIEWS_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, refresh);
      window.removeEventListener(BOOKINGS_UPDATED_EVENT, refresh);
      window.removeEventListener(REVIEWS_UPDATED_EVENT, refresh);
    };
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <section className={cabinetHeroClass}>
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Добро пожаловать, {user.fullName.split(/\s+/)[0]}!
        </h1>
        <p className="mt-2 text-sm text-muted">
          Здесь собраны ваши поездки, избранные туры и заявки на бронирование.
        </p>
        {stats.pendingBookingsCount > 0 ? (
          <p className="mt-3 text-sm text-muted">
            {stats.pendingBookingsCount}{" "}
            {stats.pendingBookingsCount === 1
              ? "заявка ожидает ответа организатора"
              : stats.pendingBookingsCount < 5
                ? "заявки ожидают ответа организатора"
                : "заявок ожидают ответа организатора"}
            .
          </p>
        ) : null}
      </section>

      <ProfileQuickActions />

      <section className={cabinetPanelClass}>
        <PersonalizedRecommendationsSection variant="profile" fetchOnMount className="space-y-0" />
      </section>

      <ProfileDashboardWidgets />

      <ProfileNotifications limit={5} />

      <section className={cabinetPanelClass}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-heading text-lg font-bold text-foreground">Последние бронирования</h3>
          <Link
            href="/profile/bookings"
            className={cn(cabinetLinkClass, "inline-flex items-center gap-1 text-sm")}
          >
            Все бронирования
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentBookings.length > 0 ? (
          <ul className="mt-4 divide-y divide-border-subtle">
            {recentBookings.map((booking) => (
              <li
                key={booking.id}
                className="flex flex-col gap-2 rounded-2xl px-2 py-4 transition-colors hover:bg-surface-muted/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-heading text-sm font-semibold text-foreground">{booking.tourTitle}</p>
                  <p className="mt-1 text-sm text-muted">
                    {booking.startDate
                      ? formatBookingTourDates(booking, "Дата по запросу")
                      : "Дата по запросу"}{" "}
                    · {booking.guests} гостей
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <BookingStatusBadge status={booking.status} />
                  <Link
                    href={`/profile/bookings/${booking.id}`}
                    className={cn(cabinetLinkClass, "text-xs")}
                  >
                    Подробнее
                  </Link>
                  <Link
                    href={buildTourMessageHref(booking.tourSlug, booking.id)}
                    className={cn(cabinetLinkClass, "text-xs")}
                  >
                    Сообщение
                  </Link>
                  <BookingReviewCta
                    booking={booking}
                    userId={user.id}
                    className={cn(cabinetLinkClass, "text-xs")}
                  />
                  <FormattedPrice priceUsd={booking.totalPriceUsd} className="text-sm font-semibold" />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="Пока нет бронирований"
            description="Выберите тур в каталоге и оформите заявку."
            action={{ label: "Выбрать тур", href: "/tours", variant: "outline" }}
            bordered={false}
            className="mt-4 px-0"
          />
        )}
      </section>
    </div>
  );
}
