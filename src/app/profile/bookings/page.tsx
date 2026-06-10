"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getUserBookings, cancelBookingByTourist } from "@/lib/bookings-store";
import { BOOKINGS_UPDATED_EVENT, type Booking } from "@/types/tourist";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import BookingStatusTimeline from "@/components/booking/BookingStatusTimeline";
import BookingOrganizerCommentsJournal from "@/components/booking/BookingOrganizerCommentsJournal";
import BookingPaymentStatusBadge from "@/components/booking/BookingPaymentStatusBadge";
import { formatBookingCreatedAt } from "@/lib/booking-datetime";
import { formatBookingTourDates } from "@/lib/booking-display";
import {
  paymentStatusNeedsAction,
  resolveBookingAmounts,
  resolveTouristPaymentLinkHref,
} from "@/lib/booking-payment-display";
import { resolveBookingPaymentStatus } from "@/lib/booking-params";
import FormattedPrice from "@/components/FormattedPrice";
import BookingReviewCta from "@/components/profile/BookingReviewCta";

export default function ProfileBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

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
    setCancelError(null);
    const result = cancelBookingByTourist(bookingId, user);
    if ("error" in result) {
      setCancelError(result.error);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-xl font-bold text-charcoal">Мои бронирования</h2>
      <p className="mt-1 text-sm text-slate">Заявки и подтверждённые поездки</p>

      {cancelError ? (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {cancelError}
        </p>
      ) : null}

      {bookings.length > 0 ? (
        <div className="mt-6 space-y-4">
          {bookings.map((booking) => {
            const expanded = expandedId === booking.id;
            const canCancel = booking.status === "new" || booking.status === "pending";
            const amounts = resolveBookingAmounts(booking);
            const paymentStatus = resolveBookingPaymentStatus(booking);
            const payHref = resolveTouristPaymentLinkHref(booking);
            const needsPayment = paymentStatusNeedsAction(paymentStatus);

            return (
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
                          {formatBookingTourDates(booking, "Даты по согласованию")} · {booking.guests} гостей
                        </p>
                        <p className="mt-1 text-xs text-slate">
                          Заявка от {formatBookingCreatedAt(booking.createdAt)}
                        </p>
                      </div>
                      <BookingStatusBadge status={booking.status} />
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                      <FormattedPrice priceUsd={booking.totalPriceUsd} className="font-semibold" />
                      <div className="flex flex-wrap gap-3">
                        <BookingReviewCta
                          booking={booking}
                          userId={user.id}
                          className="text-sm font-medium text-brand hover:underline"
                        />
                        <button
                          type="button"
                          onClick={() => setExpandedId(expanded ? null : booking.id)}
                          className="text-sm font-medium text-brand hover:underline"
                        >
                          {expanded ? "Скрыть детали" : "Подробнее"}
                        </button>
                        {canCancel ? (
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
                </div>

                {expanded ? (
                  <div className="space-y-6 border-t border-gray-100 bg-pampas/30 p-4 sm:p-5">
                    {booking.touristComment ? (
                      <div className="rounded-xl bg-white px-4 py-3 ring-1 ring-gray-200">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate">
                          Ваш комментарий
                        </p>
                        <p className="mt-1 text-sm text-charcoal">{booking.touristComment}</p>
                      </div>
                    ) : null}

                    <BookingOrganizerCommentsJournal comments={booking.organizerComments} />

                    <div>
                      <h3 className="font-display text-base font-bold text-charcoal">
                        История статусов
                      </h3>
                      <div className="mt-3 rounded-xl bg-white p-4 ring-1 ring-gray-200">
                        <BookingStatusTimeline history={booking.statusHistory} />
                      </div>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
          <p className="font-medium text-charcoal">Бронирований пока нет</p>
          <p className="mt-2 text-sm text-slate">
            Оформите заявку на странице тура или найдите гостевую заявку по email.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <Link href="/tours" className="text-sm font-medium text-brand hover:underline">
              Выбрать тур
            </Link>
            <Link href="/booking/find" className="text-sm font-medium text-brand hover:underline">
              Найти заявку по email
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
