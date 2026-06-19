"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CreditCard, ExternalLink, MessageCircle } from "lucide-react";
import { buildTourMessageHref } from "@/lib/messages-store";
import { useAuth } from "@/context/AuthContext";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import BookingPaymentStatusBadge from "@/components/booking/BookingPaymentStatusBadge";
import BookingStatusTimeline from "@/components/booking/BookingStatusTimeline";
import BookingOrganizerCommentsJournal from "@/components/booking/BookingOrganizerCommentsJournal";
import FormattedPrice from "@/components/FormattedPrice";
import { Button } from "@/components/ui/button";
import { formatBookingCreatedAt } from "@/lib/booking-datetime";
import {
  formatBookingCheckoutPaymentOption,
  formatBookingDisplayNumber,
  formatBookingTourDates,
} from "@/lib/booking-display";
import {
  canTouristAccessBooking,
  getBookingNextSteps,
  resolveBookingAmounts,
  resolveTouristPaymentLinkHref,
} from "@/lib/booking-payment-display";
import { resolveBookingPaymentStatus } from "@/lib/booking-params";
import {
  BOOKINGS_UPDATED_EVENT,
  type Booking,
} from "@/types/tourist";
import {
  cancelBookingByTourist,
  getBookingById,
} from "@/lib/bookings-store";
import {
  apiCancelBooking,
  apiFetchBookingById,
  isRemoteBookingsMode,
} from "@/lib/bookings-api";
import { cn } from "@/lib/cn";
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { normalizeSiteError, siteFormError } from "@/lib/site-feedback/normalize-error";
import type { SiteFeedbackMessage } from "@/types/site-feedback";

export default function BookingTouristDetailView({ bookingId }: { bookingId: string }) {
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [cancelError, setCancelErrorState] = useState<SiteFeedbackMessage | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const feedback = useSiteFeedback();

  const setCancelError = (value: string | SiteFeedbackMessage | null) => {
    if (value === null) {
      setCancelErrorState(null);
      return;
    }
    setCancelErrorState(typeof value === "string" ? siteFormError(value) : value);
  };

  useEffect(() => {
    function refreshLocal() {
      setBooking(getBookingById(bookingId) ?? null);
    }

    function refresh() {
      if (isRemoteBookingsMode()) {
        void apiFetchBookingById(bookingId)
          .then(setBooking)
          .catch(() => setBooking(null));
        return;
      }
      refreshLocal();
    }

    refresh();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(BOOKINGS_UPDATED_EVENT, refresh);
  }, [bookingId]);

  if (!user) return null;

  if (!booking) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate">Бронирование не найдено</p>
        <Link
          href="/profile/bookings"
          className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
        >
          К списку бронирований
        </Link>
      </div>
    );
  }

  if (!canTouristAccessBooking(booking, user.id, user.email)) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate">Нет доступа к этой заявке</p>
        <Link
          href="/profile/bookings"
          className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
        >
          К списку бронирований
        </Link>
      </div>
    );
  }

  const displayNumber = formatBookingDisplayNumber(booking.id);
  const amounts = resolveBookingAmounts(booking);
  const paymentStatus = resolveBookingPaymentStatus(booking);
  const payHref = resolveTouristPaymentLinkHref(booking);
  const nextSteps = getBookingNextSteps(booking);
  const canCancel = booking.status === "new" || booking.status === "pending";

  function handleCancel() {
    setCancelError(null);
    setCancelLoading(true);
    if (isRemoteBookingsMode()) {
      void apiCancelBooking(booking!.id)
        .then((next) => {
          setBooking(next);
          feedback.success({
            title: "Заявка отменена",
            description: "Статус бронирования обновлён.",
          });
        })
        .catch((error: Error) => {
          setCancelError(normalizeSiteError(error, {
            title: "Не удалось отменить заявку",
            steps: ["Обновите страницу", "Напишите организатору через сообщения"],
          }));
        })
        .finally(() => setCancelLoading(false));
      return;
    }
    const result = cancelBookingByTourist(booking!.id, user);
    setCancelLoading(false);
    if ("error" in result) {
      setCancelError(normalizeSiteError(result.error));
      return;
    }
    setBooking(result.booking);
    feedback.success({
      title: "Заявка отменена",
      description: "Статус бронирования обновлён.",
    });
  }

  return (
    <div className="space-y-4">
      <Link
        href="/profile/bookings"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate hover:text-brand"
      >
        <ArrowLeft className="h-4 w-4" />
        Все бронирования
      </Link>

      <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="relative aspect-[21/9] w-full bg-gray-100 sm:aspect-[3/1]">
          <Image
            src={booking.tourImage}
            alt={booking.tourTitle}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 800px"
            priority
          />
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate">
                Заявка №{displayNumber}
              </p>
              <Link
                href={`/tours/${booking.tourSlug}`}
                className="mt-1 font-heading text-xl font-bold text-charcoal hover:text-brand"
              >
                {booking.tourTitle}
              </Link>
              <p className="mt-1 text-sm text-slate">
                {formatBookingTourDates(booking, "Даты по согласованию")} · {booking.guests} гостей
              </p>
              <p className="mt-1 text-xs text-slate">
                Оформлена {formatBookingCreatedAt(booking.createdAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <BookingStatusBadge status={booking.status} />
              <BookingPaymentStatusBadge status={paymentStatus} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-gray-50 px-4 py-3">
              <p className="text-xs text-slate">Сумма тура</p>
              <FormattedPrice priceUsd={amounts.total} className="mt-1 text-lg font-bold" />
            </div>
            <div className="rounded-xl bg-emerald-50/80 px-4 py-3">
              <p className="text-xs text-slate">Оплачено</p>
              <FormattedPrice priceUsd={amounts.paid} className="mt-1 text-lg font-bold text-emerald-800" />
            </div>
            <div className="rounded-xl bg-amber-50/80 px-4 py-3">
              <p className="text-xs text-slate">К оплате</p>
              <FormattedPrice priceUsd={amounts.due} className="mt-1 text-lg font-bold text-amber-900" />
            </div>
          </div>

          {booking.checkoutPaymentOption ? (
            <p className="mt-4 text-sm text-slate">
              Способ оплаты при бронировании:{" "}
              <span className="font-medium text-charcoal">
                {formatBookingCheckoutPaymentOption(booking.checkoutPaymentOption)}
              </span>
            </p>
          ) : null}

          {payHref ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-sky-200/70 bg-sky-50/50 px-4 py-3">
              <CreditCard className="h-5 w-5 shrink-0 text-sky" />
              <p className="min-w-0 flex-1 text-sm text-charcoal">
                Доступна ссылка на оплату. Онлайн-оплата через платформу скоро — сейчас вы можете
                открыть счёт и подтвердить намерение оплатить.
              </p>
              <Link
                href={payHref}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Перейти к оплате
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          ) : paymentStatus === "pending" || paymentStatus === "partial" ? (
            <p className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm text-slate">
              Ссылка на оплату появится после подтверждения заявки организатором.
            </p>
          ) : null}

          {nextSteps.length > 0 ? (
            <div className="mt-6">
              <h3 className="font-heading text-base font-bold text-charcoal">Следующие шаги</h3>
              <ul className="mt-3 space-y-3">
                {nextSteps.map((step) => (
                  <li
                    key={step.id}
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm leading-relaxed ring-1",
                      step.tone === "action" && "bg-brand-light/30 ring-brand/20",
                      step.tone === "warning" && "bg-amber-50 ring-amber-200/80",
                      step.tone === "info" && "bg-gray-50 ring-gray-200/80"
                    )}
                  >
                    <p className="font-medium text-charcoal">{step.title}</p>
                    <p className="mt-1 text-slate">{step.description}</p>
                    {step.href ? (
                      <Link
                        href={step.href}
                        className="mt-2 inline-flex text-sm font-medium text-brand hover:underline"
                      >
                        Открыть
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {booking.touristComment ? (
            <div className="mt-6 rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-gray-200">
              <p className="text-xs font-medium uppercase tracking-wide text-slate">Ваш комментарий</p>
              <p className="mt-1 text-sm text-charcoal">{booking.touristComment}</p>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
            <MessageCircle className="h-5 w-5 shrink-0 text-brand" />
            <p className="min-w-0 flex-1 text-sm text-slate">
              Вопросы по туру — в переписке с организатором в личном кабинете.
            </p>
            <Link
              href={buildTourMessageHref(booking.tourSlug, booking.id)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Написать организатору
            </Link>
          </div>

          <div className="mt-6">
            <BookingOrganizerCommentsJournal comments={booking.organizerComments} />
          </div>

          <div className="mt-6">
            <h3 className="font-heading text-base font-bold text-charcoal">История статусов</h3>
            <div className="mt-3 rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200">
              <BookingStatusTimeline history={booking.statusHistory} />
            </div>
          </div>

          {cancelError ? (
            <InlineFeedback
              variant="error"
              title={cancelError.title}
              description={cancelError.description}
              steps={cancelError.steps}
              action={cancelError.action}
              className="mt-4"
            />
          ) : null}

          {canCancel ? (
            <Button
              type="button"
              variant="outline"
              className="mt-6"
              loading={cancelLoading}
              loadingLabel="Отменяем…"
              onClick={handleCancel}
            >
              Отменить заявку
            </Button>
          ) : null}
        </div>
      </article>
    </div>
  );
}
