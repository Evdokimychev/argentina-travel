"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import BookingStatusTimeline from "@/components/booking/BookingStatusTimeline";
import BookingOrganizerCommentsEditor from "@/components/booking/BookingOrganizerCommentsEditor";
import {
  BOOKING_STATUS_LABELS,
  ORGANIZER_BOOKING_TRANSITIONS,
  isActiveBookingStatus,
} from "@/data/booking-statuses";
import { formatBookingCreatedAt } from "@/lib/booking-datetime";
import { getBookingById, updateBookingStatusWithHistory } from "@/lib/bookings-store";
import { BOOKINGS_UPDATED_EVENT, type Booking, type BookingStatusActive } from "@/types/tourist";
import { formatDateShort } from "@/lib/utils";
import FormattedPrice from "@/components/FormattedPrice";
import { Button } from "@/components/ui/button";

function formatTourDates(booking: Booking): string {
  if (!booking.startDate) return "Даты по согласованию";
  const start = formatDateShort(booking.startDate);
  return booking.endDate ? `${start} — ${formatDateShort(booking.endDate)}` : start;
}

export default function OrganizerBookingDetailView({ bookingId }: { bookingId: string }) {
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    function refresh() {
      setBooking(getBookingById(bookingId) ?? null);
    }

    refresh();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(BOOKINGS_UPDATED_EVENT, refresh);
  }, [bookingId]);

  if (!booking) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate">Заявка не найдена</p>
        <Link href="/organizer/bookings" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
          Вернуться к списку
        </Link>
      </div>
    );
  }

  const currentStatus = isActiveBookingStatus(booking.status) ? booking.status : "pending";
  const nextStatuses = ORGANIZER_BOOKING_TRANSITIONS[currentStatus] ?? [];

  function handleStatusChange(nextStatus: BookingStatusActive) {
    setStatusLoading(true);
    setStatusError(null);

    const result = updateBookingStatusWithHistory({
      bookingId,
      status: nextStatus,
      changedBy: "organizer",
      actor: user,
    });

    setStatusLoading(false);

    if ("error" in result) {
      setStatusError(result.error);
      return;
    }

    setBooking(result.booking);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/organizer/bookings"
            className="inline-flex items-center gap-1.5 text-sm text-slate transition-colors hover:text-brand"
          >
            <ArrowLeft className="h-4 w-4" />
            Все заявки
          </Link>
          <h1 className="mt-2 font-display text-2xl font-bold text-charcoal">Заявка #{booking.id.slice(-8)}</h1>
          <p className="mt-1 text-sm text-slate">
            Создана {formatBookingCreatedAt(booking.createdAt)}
          </p>
        </div>
        <BookingStatusBadge status={booking.status} className="text-sm" />
      </div>

      {nextStatuses.length > 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-sm font-medium text-charcoal">Изменить статус</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {nextStatuses.map((status) => (
              <Button
                key={status}
                type="button"
                size="sm"
                variant={status === "cancelled" ? "outline" : "default"}
                disabled={statusLoading}
                onClick={() => handleStatusChange(status)}
              >
                {BOOKING_STATUS_LABELS[status]}
              </Button>
            ))}
          </div>
          {statusError ? (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {statusError}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-lg font-bold text-charcoal">Турист</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate">Имя</dt>
              <dd className="mt-0.5 font-medium text-charcoal">{booking.contactName}</dd>
            </div>
            <div>
              <dt className="text-slate">Email</dt>
              <dd className="mt-0.5">
                <a
                  href={`mailto:${booking.contactEmail}`}
                  className="inline-flex items-center gap-1.5 font-medium text-brand hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {booking.contactEmail}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-slate">Телефон</dt>
              <dd className="mt-0.5">
                <a
                  href={`tel:${booking.contactPhone}`}
                  className="inline-flex items-center gap-1.5 font-medium text-brand hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  {booking.contactPhone}
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-lg font-bold text-charcoal">Тур</h2>
          <div className="mt-4 flex gap-4">
            <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100">
              <Image src={booking.tourImage} alt="" fill className="object-cover" sizes="112px" />
            </div>
            <div className="min-w-0">
              <Link
                href={`/tours/${booking.tourSlug}`}
                className="font-medium text-charcoal hover:text-brand"
              >
                {booking.tourTitle}
              </Link>
              <p className="mt-2 text-sm text-slate">{formatTourDates(booking)}</p>
              <p className="mt-1 text-sm text-slate">{booking.guests} гостей</p>
              <p className="mt-2">
                <FormattedPrice priceUsd={booking.totalPriceUsd} className="font-semibold" />
              </p>
            </div>
          </div>
          {booking.touristComment ? (
            <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate">
                Комментарий туриста
              </p>
              <p className="mt-1 text-sm text-charcoal">{booking.touristComment}</p>
            </div>
          ) : null}
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="font-display text-lg font-bold text-charcoal">История статусов</h2>
        <div className="mt-4">
          <BookingStatusTimeline history={booking.statusHistory} />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <BookingOrganizerCommentsEditor
          bookingId={booking.id}
          comments={booking.organizerComments}
          authorName={user?.fullName ?? "Организатор"}
          onUpdated={() => setBooking(getBookingById(bookingId) ?? null)}
        />
      </section>
    </div>
  );
}
