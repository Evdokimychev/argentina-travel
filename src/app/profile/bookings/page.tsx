"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, ListOrdered } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getUserBookings, cancelBookingByTourist } from "@/lib/bookings-store";
import {
  apiCancelBooking,
  apiFetchTripsterBookingRequests,
  apiFetchYouTravelBookingRequests,
  apiFetchUserBookings,
  apiLookupBookingsByEmail,
  isRemoteBookingsMode,
} from "@/lib/bookings-api";
import { buildTourMessageHref } from "@/lib/messages-store";
import { BOOKINGS_UPDATED_EVENT, type Booking } from "@/types/tourist";
import type { TripsterBookingRequestView } from "@/types/tripster-booking";
import type { YouTravelBookingRequestView } from "@/types/youtravel-booking";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBookingCreatedAt } from "@/lib/booking-datetime";
import { formatBookingTourDates } from "@/lib/booking-display";
import FormattedPrice from "@/components/FormattedPrice";
import BookingReviewCta from "@/components/profile/BookingReviewCta";
import BookingListSkeleton from "@/components/profile/BookingListSkeleton";
import ProfileWaitlistSection from "@/components/profile/ProfileWaitlistSection";
import { cn } from "@/lib/cn";
import {
  cabinetCardClass,
  cabinetLinkClass,
  cabinetPageSubtitleClass,
  cabinetPageTitleClass,
  cabinetPanelClass,
} from "@/lib/cabinet-ui";

const PARTNER_STATUS_LABELS: Record<string, string> = {
  pending: "В обработке",
  submitted: "Отправлена",
  confirmed: "Подтверждена",
  cancelled: "Отменена",
  completed: "Завершена",
  affiliate_fallback: "Перенаправлена на сайт",
  failed: "Ошибка отправки",
  api_unavailable: "API недоступен",
  unknown: "Статус уточняется",
};

function formatPartnerBookingStatus(status: string | null): string {
  const key = status?.trim().toLowerCase() || "unknown";
  return PARTNER_STATUS_LABELS[key] ?? status ?? PARTNER_STATUS_LABELS.unknown;
}

export default function ProfileBookingsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "waitlist" ? "waitlist" : "bookings";
  const [tab, setTab] = useState<"bookings" | "waitlist">(initialTab);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tripsterRequests, setTripsterRequests] = useState<TripsterBookingRequestView[]>([]);
  const [youtravelRequests, setYoutravelRequests] = useState<YouTravelBookingRequestView[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingTripsterRequests, setLoadingTripsterRequests] = useState(true);
  const [loadingYoutravelRequests, setLoadingYoutravelRequests] = useState(true);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    function refresh() {
      setLoadingBookings(true);
      setLoadingTripsterRequests(true);
      setLoadingYoutravelRequests(true);
      if (isRemoteBookingsMode()) {
        void Promise.all([
          apiFetchUserBookings(),
          apiFetchTripsterBookingRequests(),
          apiFetchYouTravelBookingRequests(),
        ])
          .then(([nextBookings, nextTripster, nextYoutravel]) => {
            setBookings(nextBookings);
            setTripsterRequests(nextTripster);
            setYoutravelRequests(nextYoutravel);
          })
          .catch(() => {
            setBookings([]);
            setTripsterRequests([]);
            setYoutravelRequests([]);
          })
          .finally(() => {
            setLoadingBookings(false);
            setLoadingTripsterRequests(false);
            setLoadingYoutravelRequests(false);
          });
        return;
      }
      setBookings(getUserBookings(user!.id));
      setTripsterRequests([]);
      setYoutravelRequests([]);
      setLoadingBookings(false);
      setLoadingTripsterRequests(false);
      setLoadingYoutravelRequests(false);
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
    setLoadingBookings(true);
    setLoadingTripsterRequests(true);
    setLoadingYoutravelRequests(true);
    if (isRemoteBookingsMode()) {
      void Promise.all([
        apiFetchUserBookings(),
        apiFetchTripsterBookingRequests(),
        apiFetchYouTravelBookingRequests(),
      ])
        .then(([nextBookings, nextTripster, nextYoutravel]) => {
          setBookings(nextBookings);
          setTripsterRequests(nextTripster);
          setYoutravelRequests(nextYoutravel);
        })
        .finally(() => {
          setLoadingBookings(false);
          setLoadingTripsterRequests(false);
          setLoadingYoutravelRequests(false);
        });
      return;
    }
    setBookings(getUserBookings(user.id));
    setTripsterRequests([]);
    setYoutravelRequests([]);
    setLoadingBookings(false);
    setLoadingTripsterRequests(false);
    setLoadingYoutravelRequests(false);
  }

  return (
    <div className={cabinetPanelClass}>
      <h1 className={cabinetPageTitleClass}>Мои бронирования</h1>
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

      {loadingBookings ? (
        <BookingListSkeleton className="mt-6" />
      ) : bookings.length > 0 ? (
        <div className="mt-6 space-y-4">
          {bookings.map((booking) => {
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
                        <Link href={`/profile/bookings/${booking.id}`} className={cabinetLinkClass}>
                          Открыть заявку
                        </Link>
                        <Link
                          href={buildTourMessageHref(booking.tourSlug, booking.id)}
                          className={cabinetLinkClass}
                        >
                          Написать организатору
                        </Link>
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
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          variant="cabinet"
          icon={CalendarDays}
          title="Бронирований пока нет"
          description="Оформите заявку на странице тура или найдите гостевую заявку по email."
          action={{ label: "Выбрать тур", href: "/tours" }}
          secondaryAction={{ label: "Найти заявку по email", href: "/booking/find", variant: "outline" }}
          className="mt-8"
        />
      )}

      <section className={cn(cabinetCardClass, "mt-6 p-4 sm:p-5")}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-bold text-charcoal">Заявки в Tripster</h2>
          {!loadingTripsterRequests ? (
            <span className="text-xs text-slate">Всего: {tripsterRequests.length}</span>
          ) : null}
        </div>

        {loadingTripsterRequests ? (
          <p className="mt-3 text-sm text-slate">Загружаем статусы заявок…</p>
        ) : tripsterRequests.length === 0 ? (
          <p className="mt-3 text-sm text-slate">
            Пока нет заявок Tripster. После отправки формы на экскурсии они появятся здесь.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {tripsterRequests.map((request) => (
              <article key={request.id} className="rounded-2xl border border-gray-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/excursions/${request.experienceSlug}`}
                      className="font-medium text-charcoal transition-colors hover:text-sky"
                    >
                      {request.experienceTitle}
                    </Link>
                    <p className="mt-1 text-sm text-slate">
                      {request.eventDate} · {request.eventTime} · {request.personsCount} чел.
                    </p>
                    <p className="mt-1 text-xs text-slate">
                      Отправлено {formatBookingCreatedAt(request.createdAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-sky/10 px-3 py-1 text-xs font-medium text-sky">
                    {formatPartnerBookingStatus(request.tripsterStatus)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  <Link href={`/excursions/${request.experienceSlug}`} className={cabinetLinkClass}>
                    К экскурсии
                  </Link>
                  {request.tripsterOrderUrl ? (
                    <a
                      href={request.tripsterOrderUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={cabinetLinkClass}
                    >
                      Открыть заказ на сайте
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={cn(cabinetCardClass, "mt-6 p-4 sm:p-5")}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-bold text-charcoal">Заявки YouTravel.me</h2>
          {!loadingYoutravelRequests ? (
            <span className="text-xs text-slate">Всего: {youtravelRequests.length}</span>
          ) : null}
        </div>

        {loadingYoutravelRequests ? (
          <p className="mt-3 text-sm text-slate">Загружаем статусы заявок…</p>
        ) : youtravelRequests.length === 0 ? (
          <p className="mt-3 text-sm text-slate">
            Пока нет заявок YouTravel.me. После отправки формы на партнёрском туре они появятся здесь.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {youtravelRequests.map((request) => (
              <article key={request.id} className="rounded-2xl border border-gray-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/tours/${request.tourSlug}`}
                      className="font-medium text-charcoal transition-colors hover:text-sky"
                    >
                      {request.tourTitle}
                    </Link>
                    <p className="mt-1 text-sm text-slate">
                      {request.startDate}
                      {request.endDate ? ` — ${request.endDate}` : ""} · {request.personsCount} чел.
                    </p>
                    <p className="mt-1 text-xs text-slate">
                      Отправлено {formatBookingCreatedAt(request.createdAt)}
                    </p>
                  </div>
                  <span className="rounded-full bg-sky/10 px-3 py-1 text-xs font-medium text-sky">
                    {formatPartnerBookingStatus(request.youtravelStatus)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  <Link href={`/tours/${request.tourSlug}`} className={cabinetLinkClass}>
                    К туру
                  </Link>
                  {request.youtravelOrderUrl ? (
                    <a
                      href={request.youtravelOrderUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={cabinetLinkClass}
                    >
                      Открыть заказ на сайте
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
        </>
      )}
    </div>
  );
}
