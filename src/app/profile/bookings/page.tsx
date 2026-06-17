"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, ListOrdered } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserBookings, cancelBookingByTourist } from "@/lib/bookings-store";
import { apiCancelBooking, apiFetchUserBookings, isRemoteBookingsMode } from "@/lib/bookings-api";
import { BOOKINGS_UPDATED_EVENT, type Booking } from "@/types/tourist";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import BookingStatusTimeline from "@/components/booking/BookingStatusTimeline";
import BookingOrganizerCommentsJournal from "@/components/booking/BookingOrganizerCommentsJournal";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBookingCreatedAt } from "@/lib/booking-datetime";
import { formatBookingTourDates } from "@/lib/booking-display";
import FormattedPrice from "@/components/FormattedPrice";
import BookingReviewCta from "@/components/profile/BookingReviewCta";
import ProfileWaitlistSection from "@/components/profile/ProfileWaitlistSection";
import { cn } from "@/lib/cn";
import {
  cabinetCardClass,
  cabinetLinkClass,
  cabinetPageSubtitleClass,
  cabinetPageTitleClass,
  cabinetPanelClass,
} from "@/lib/cabinet-ui";

export default function ProfileBookingsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "waitlist" ? "waitlist" : "bookings";
  const [tab, setTab] = useState<"bookings" | "waitlist">(initialTab);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    function refresh() {
      if (isRemoteBookingsMode()) {
        void apiFetchUserBookings()
          .then(setBookings)
          .catch(() => setBookings([]));
        return;
      }
      setBookings(getUserBookings(user!.id));
    }

    refresh();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(BOOKINGS_UPDATED_EVENT, refresh);
  }, [user]);

  if (!user) return null;

  function handleCancel(bookingId: string) {
    setCancelError(null);
    if (isRemoteBookingsMode()) {
      void apiCancelBooking(bookingId)
        .then(() => refreshBookings())
        .catch((error: Error) => setCancelError(error.message));
      return;
    }
    const result = cancelBookingByTourist(bookingId, user);
    if ("error" in result) {
      setCancelError(result.error);
    }
  }

  function refreshBookings() {
    if (!user) return;
    if (isRemoteBookingsMode()) {
      void apiFetchUserBookings().then(setBookings);
      return;
    }
    setBookings(getUserBookings(user.id));
  }

  return (
    <div className={cabinetPanelClass}>
      <h2 className={cabinetPageTitleClass}>Мои бронирования</h2>
      <p className={cabinetPageSubtitleClass}>Заявки, подтверждённые поездки и лист ожидания</p>

      <div className="mt-6 flex gap-2 rounded-xl bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setTab("bookings")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            tab === "bookings" ? "bg-white text-charcoal shadow-sm" : "text-slate hover:text-charcoal"
          )}
        >
          <CalendarDays className="h-4 w-4" aria-hidden />
          Бронирования
        </button>
        <button
          type="button"
          onClick={() => setTab("waitlist")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            tab === "waitlist" ? "bg-white text-charcoal shadow-sm" : "text-slate hover:text-charcoal"
          )}
        >
          <ListOrdered className="h-4 w-4" aria-hidden />
          Лист ожидания
        </button>
      </div>

      {tab === "waitlist" ? (
        <ProfileWaitlistSection />
      ) : (
        <>

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
            return (
              <article
                key={booking.id}
                className={cn(cabinetCardClass, "overflow-hidden")}
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
                          className="font-heading text-base font-bold text-charcoal transition-colors hover:text-sky"
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
                          className={cabinetLinkClass}
                        />
                        <button
                          type="button"
                          onClick={() => setExpandedId(expanded ? null : booking.id)}
                          className={cabinetLinkClass}
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
                  <div className="space-y-6 border-t border-gray-100 bg-surface-muted/50 p-4 sm:p-5">
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
                      <h3 className="font-heading text-base font-bold text-charcoal">
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
        <EmptyState
          icon={CalendarDays}
          title="Бронирований пока нет"
          description="Оформите заявку на странице тура или найдите гостевую заявку по email."
          action={{ label: "Выбрать тур", href: "/tours", variant: "outline" }}
          secondaryAction={{ label: "Найти заявку по email", href: "/booking/find" }}
          className="mt-8"
        />
      )}
        </>
      )}
    </div>
  );
}
