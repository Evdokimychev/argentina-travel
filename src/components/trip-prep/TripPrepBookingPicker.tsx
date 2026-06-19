"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserBookings } from "@/lib/bookings-store";
import { apiFetchUserBookings, isRemoteBookingsMode } from "@/lib/bookings-api";
import { formatBookingTourDates } from "@/lib/booking-display";
import { getLocalTripPrepPercent } from "@/lib/trip-prep-local";
import { BOOKINGS_UPDATED_EVENT, type Booking } from "@/types/tourist";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import { cn } from "@/lib/cn";

function isEligibleForTripPrep(booking: Booking): boolean {
  if (!booking.startDate) return false;
  return booking.status === "confirmed" || booking.status === "pending";
}

export default function TripPrepBookingPicker() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!user) return;

    async function refresh() {
      const list = isRemoteBookingsMode()
        ? await apiFetchUserBookings()
        : getUserBookings(user!.id);
      setBookings(list.filter(isEligibleForTripPrep));
    }

    void refresh();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(BOOKINGS_UPDATED_EVENT, refresh);
  }, [user]);

  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-slate shadow-sm">
        Пока нет подтверждённых поездок с датами. После подтверждения заявки здесь появится чек-лист.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {bookings.map((booking) => {
        const percent = isRemoteBookingsMode() ? null : getLocalTripPrepPercent(booking.id);
        return (
          <Link
            key={booking.id}
            href={`/profile/trip-prep?bookingId=${encodeURIComponent(booking.id)}`}
            className={cn(
              "group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-brand/30 hover:bg-brand-light/10"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-charcoal group-hover:text-brand">{booking.tourTitle}</p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatBookingTourDates(booking, "Даты по согласованию")}
                </p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </div>
            {percent !== null ? (
              <p className="mt-3 text-xs text-slate">Прогресс: {percent}%</p>
            ) : null}
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand">
              Открыть чек-лист
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
