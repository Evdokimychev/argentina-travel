"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUserBookings, updateBookingStatus } from "@/lib/bookings-store";
import { BOOKINGS_UPDATED_EVENT, type Booking, type BookingStatus } from "@/types/tourist";
import { BOOKING_STATUS_LABELS } from "@/data/tourist-dashboard";
import { formatDateShort } from "@/lib/utils";
import FormattedPrice from "@/components/FormattedPrice";
import { cn } from "@/lib/cn";

const STATUS_TONE: Record<BookingStatus, string> = {
  pending: "bg-amber-50 text-amber-800",
  confirmed: "bg-emerald-50 text-emerald-800",
  cancelled: "bg-gray-100 text-slate",
  completed: "bg-sky/10 text-sky",
};

export default function ProfileBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!user) return;

    function refresh() {
      setBookings(getUserBookings(user!.id));
    }

    refresh();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(BOOKINGS_UPDATED_EVENT, refresh);
  }, [user]);

  if (!user) return null;

  function handleCancel(bookingId: string) {
    updateBookingStatus(bookingId, "cancelled");
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-xl font-bold text-charcoal">Мои бронирования</h2>
      <p className="mt-1 text-sm text-slate">Заявки и подтверждённые поездки без онлайн-оплаты</p>

      {bookings.length > 0 ? (
        <div className="mt-6 space-y-4">
          {bookings.map((booking) => (
            <article
              key={booking.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="relative aspect-[16/9] w-full sm:aspect-auto sm:h-auto sm:w-44 sm:shrink-0">
                  <Image
                    src={booking.tourImage}
                    alt={booking.tourTitle}
                    fill
                    className="object-cover"
                    sizes="176px"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/tours/${booking.tourSlug}`}
                        className="font-display text-base font-bold text-charcoal hover:text-brand"
                      >
                        {booking.tourTitle}
                      </Link>
                      <p className="mt-1 text-sm text-slate">
                        {booking.startDate
                          ? `${formatDateShort(booking.startDate)}${booking.endDate ? ` — ${formatDateShort(booking.endDate)}` : ""}`
                          : "Даты по согласованию"}{" "}
                        · {booking.guests} гостей
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        STATUS_TONE[booking.status]
                      )}
                    >
                      {BOOKING_STATUS_LABELS[booking.status]}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate">
                    <span>{booking.contactEmail}</span>
                    <span>{booking.contactPhone}</span>
                  </div>

                  {booking.comments ? (
                    <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-charcoal">
                      {booking.comments}
                    </p>
                  ) : null}

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                    <FormattedPrice priceUsd={booking.totalPriceUsd} className="font-semibold" />
                    {booking.status === "pending" ? (
                      <button
                        type="button"
                        onClick={() => handleCancel(booking.id)}
                        className="text-sm font-medium text-slate transition-colors hover:text-red-600"
                      >
                        Отменить заявку
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
          <p className="font-medium text-charcoal">Бронирований пока нет</p>
          <p className="mt-2 text-sm text-slate">
            Оформите заявку на странице тура — она появится здесь со статусом «Ожидает подтверждения».
          </p>
          <Link href="/tours" className="mt-4 inline-flex text-sm font-medium text-brand hover:underline">
            Выбрать тур
          </Link>
        </div>
      )}
    </div>
  );
}
