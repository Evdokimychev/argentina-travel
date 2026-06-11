"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, Heart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getRecentBookings, getTouristDashboardStats } from "@/lib/tourist-dashboard";
import { BOOKINGS_UPDATED_EVENT, FAVORITES_UPDATED_EVENT, REVIEWS_UPDATED_EVENT } from "@/types/tourist";
import { BOOKING_STATUS_LABELS } from "@/data/tourist-dashboard";
import { formatBookingTourDates } from "@/lib/booking-display";
import FormattedPrice from "@/components/FormattedPrice";
import BookingReviewCta from "@/components/profile/BookingReviewCta";
import ProfileNotifications from "@/components/profile/ProfileNotifications";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";

function DashboardStatCard({
  label,
  value,
  href,
  icon: Icon,
}: {
  label: string;
  value: number;
  href: string;
  icon: typeof Heart;
}) {
  return (
    <Link
      href={href}
      className="block transition-colors hover:[&>div]:border-sky/30 hover:[&>div]:shadow-md motion-reduce:transition-none"
    >
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate">{label}</p>
            <p className="mt-2 font-heading text-3xl font-bold text-charcoal">{value}</p>
          </div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky/10 text-sky">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
        </div>
      </Card>
    </Link>
  );
}

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
      <section className={cn("rounded-2xl border border-gray-100 bg-white p-5 shadow-card sm:p-6")}>
        <h2 className="font-heading text-2xl font-bold text-charcoal sm:text-3xl">
          Добро пожаловать, {user.fullName.split(/\s+/)[0]}!
        </h2>
        <p className="mt-2 text-sm text-slate">
          Здесь собраны ваши поездки, избранные туры и заявки на бронирование.
        </p>
      </section>

      <ProfileNotifications limit={5} />

      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardStatCard
          label="Поездки"
          value={stats.tripsCount}
          href="/profile/bookings"
          icon={CalendarDays}
        />
        <DashboardStatCard
          label="Избранное"
          value={stats.favoritesCount}
          href="/profile/favorites"
          icon={Heart}
        />
        <DashboardStatCard
          label="Заявки"
          value={stats.pendingBookingsCount}
          href="/profile/bookings"
          icon={Clock3}
        />
      </div>

      <section className={cn("rounded-2xl border border-gray-100 bg-white p-5 shadow-card sm:p-6")}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-heading text-lg font-bold text-charcoal">Последние бронирования</h3>
          <Link
            href="/profile/bookings"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
          >
            Все бронирования
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {recentBookings.length > 0 ? (
          <ul className="mt-4 divide-y divide-gray-100">
            {recentBookings.map((booking) => (
              <li key={booking.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-charcoal">{booking.tourTitle}</p>
                  <p className="mt-1 text-sm text-slate">
                    {booking.startDate
                      ? formatBookingTourDates(booking, "Дата по запросу")
                      : "Дата по запросу"}{" "}
                    · {booking.guests} гостей
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-charcoal">
                    {BOOKING_STATUS_LABELS[booking.status]}
                  </span>
                  <Link
                    href={`/profile/bookings/${booking.id}`}
                    className="text-xs font-medium text-brand hover:underline"
                  >
                    Подробнее
                  </Link>
                  <BookingReviewCta
                    booking={booking}
                    userId={user.id}
                    className="text-xs font-medium text-brand hover:underline"
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
