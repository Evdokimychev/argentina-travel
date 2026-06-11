"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronUp,
  Clock3,
  Inbox,
  Mail,
  MessageCircle,
  Phone,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import BookingStatusTimeline from "@/components/booking/BookingStatusTimeline";
import BookingOrganizerCommentsEditor from "@/components/booking/BookingOrganizerCommentsEditor";
import BookingTravelersOrganizerSection from "@/components/booking/BookingTravelersOrganizerSection";
import {
  ORGANIZER_BOOKING_TRANSITIONS,
  isActiveBookingStatus,
} from "@/data/booking-statuses";
import {
  getOrganizerBookingAlerts,
  ORGANIZER_BOOKING_STATUS_META,
} from "@/data/organizer-booking-detail";
import { formatBookingCreatedAt } from "@/lib/booking-datetime";
import {
  canOrganizerSeeContactDetails,
  formatBookingDisplayNumber,
  formatBookingTourDates,
} from "@/lib/booking-display";
import { getBookingById, updateBookingStatusWithHistory } from "@/lib/bookings-store";
import { buildOrganizerBookingMessageHref } from "@/lib/messages-store";
import { BOOKINGS_UPDATED_EVENT, type Booking, type BookingStatusActive } from "@/types/tourist";
import BookingOrganizerDataPanel from "@/components/booking/BookingOrganizerDataPanel";
import FormattedPrice from "@/components/FormattedPrice";
import BookingPaymentStatusBadge from "@/components/booking/BookingPaymentStatusBadge";
import { resolveBookingAmounts } from "@/lib/booking-payment-display";
import { formatBookingCheckoutPaymentOption } from "@/lib/booking-display";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

function StatusIcon({ status }: { status: BookingStatusActive }) {
  const className = "h-5 w-5";
  switch (status) {
    case "new":
      return <Inbox className={className} strokeWidth={1.75} />;
    case "pending":
      return <Clock3 className={className} strokeWidth={1.75} />;
    case "confirmed":
      return <Check className={className} strokeWidth={2} />;
    case "cancelled":
      return <X className={className} strokeWidth={2} />;
    case "completed":
      return <BadgeCheck className={className} strokeWidth={1.75} />;
  }
}

function DetailRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1 border-b border-gray-100 py-3 sm:grid-cols-[140px_1fr] sm:gap-4", className)}>
      <dt className="text-sm text-slate">{label}</dt>
      <dd className="text-sm font-medium text-charcoal">{children}</dd>
    </div>
  );
}

function MaskedContact({ label }: { label: string }) {
  return (
    <span className="text-sm text-slate">
      {label}{" "}
      <span className="font-normal text-slate/80">· доступны после перевода в обработку</span>
    </span>
  );
}

export default function OrganizerBookingDetailView({ bookingId }: { bookingId: string }) {
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

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
      <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-slate">Заявка не найдена</p>
        <Link
          href="/organizer/bookings"
          className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
        >
          Вернуться к списку
        </Link>
      </div>
    );
  }

  const currentStatus = isActiveBookingStatus(booking.status) ? booking.status : "pending";
  const statusMeta = ORGANIZER_BOOKING_STATUS_META[currentStatus];
  const nextStatuses = ORGANIZER_BOOKING_TRANSITIONS[currentStatus] ?? [];
  const displayNumber = formatBookingDisplayNumber(booking.id);
  const showContacts = canOrganizerSeeContactDetails(booking.status);
  const alerts = getOrganizerBookingAlerts(currentStatus, Boolean(booking.startDate));

  const primaryAction: BookingStatusActive | null =
    currentStatus === "new" && nextStatuses.includes("pending")
      ? "pending"
      : nextStatuses.includes("confirmed")
        ? "confirmed"
        : null;
  const secondaryConfirmAction =
    currentStatus === "new" && nextStatuses.includes("confirmed") ? "confirmed" : null;
  const cancelAction = nextStatuses.includes("cancelled") ? "cancelled" : null;
  const completeAction =
    currentStatus === "confirmed" && nextStatuses.includes("completed") ? "completed" : null;

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
    <div className="space-y-4">
      <Link
        href="/organizer/bookings"
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-charcoal shadow-sm transition-colors hover:bg-gray-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад
      </Link>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-200/60">
            <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    statusMeta.iconToneClass
                  )}
                >
                  <StatusIcon status={currentStatus} />
                </span>
                <p className={cn("text-base font-semibold", statusMeta.toneClass)}>
                  {statusMeta.headline}
                </p>
              </div>

              <h1 className="mt-4 font-display text-2xl font-bold text-charcoal">
                Заявка №{displayNumber}
              </h1>
              <p className="mt-1 text-sm text-slate">С маркетплейса «Пора в Аргентину»</p>
              <p className="mt-0.5 text-sm text-slate">
                Создана {formatBookingCreatedAt(booking.createdAt)}
              </p>
            </div>

            <div className="space-y-4 px-5 py-5 sm:px-6">
              {alerts.map((alert) => (
                <div
                  key={alert.text}
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm leading-relaxed",
                    alert.tone === "amber"
                      ? "bg-amber-50 text-amber-950 ring-1 ring-amber-100"
                      : "bg-yellow-50 text-yellow-950 ring-1 ring-yellow-100"
                  )}
                >
                  {alert.text}
                </div>
              ))}

              <dl>
                <DetailRow label="Тур">
                  <div className="flex items-start gap-3">
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <Image
                        src={booking.tourImage}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/tours/${booking.tourSlug}`}
                        className="font-medium text-brand hover:underline"
                      >
                        {booking.tourTitle}
                      </Link>
                    </div>
                  </div>
                </DetailRow>

                <DetailRow label="Туристов">
                  {booking.guests} {booking.guests === 1 ? "человек" : "человека"}
                </DetailRow>

                <DetailRow label="Стоимость">
                  <FormattedPrice priceUsd={booking.totalPriceUsd} className="font-semibold" />
                </DetailRow>

                <DetailRow label="Оплата">
                  <div className="space-y-1">
                    <BookingPaymentStatusBadge booking={booking} />
                    <p className="text-xs font-normal text-slate">
                      Оплачено:{" "}
                      <FormattedPrice
                        priceUsd={resolveBookingAmounts(booking).paid}
                        className="font-medium text-charcoal"
                      />
                      {" · "}К оплате:{" "}
                      <FormattedPrice
                        priceUsd={resolveBookingAmounts(booking).due}
                        className="font-medium text-charcoal"
                      />
                    </p>
                    {booking.checkoutPaymentOption ? (
                      <p className="text-xs font-normal text-slate">
                        При бронировании: {formatBookingCheckoutPaymentOption(booking.checkoutPaymentOption)}
                      </p>
                    ) : null}
                  </div>
                </DetailRow>

                <DetailRow label="Даты">{formatBookingTourDates(booking)}</DetailRow>

                <DetailRow label="Контактное лицо">{booking.contactName}</DetailRow>

                <DetailRow label="Телефон">
                  {showContacts ? (
                    <a
                      href={`tel:${booking.contactPhone}`}
                      className="inline-flex items-center gap-1.5 text-brand hover:underline"
                    >
                      <Phone className="h-4 w-4" />
                      {booking.contactPhone}
                    </a>
                  ) : (
                    <MaskedContact label="Скрыт" />
                  )}
                </DetailRow>

                <DetailRow label="Email">
                  {showContacts ? (
                    <a
                      href={`mailto:${booking.contactEmail}`}
                      className="inline-flex items-center gap-1.5 break-all text-brand hover:underline"
                    >
                      <Mail className="h-4 w-4 shrink-0" />
                      {booking.contactEmail}
                    </a>
                  ) : (
                    <MaskedContact label="Скрыт" />
                  )}
                </DetailRow>

                {booking.touristComment ? (
                  <DetailRow label="Комментарий" className="border-b-0">
                    <span className="font-normal leading-relaxed text-charcoal">
                      {booking.touristComment}
                    </span>
                  </DetailRow>
                ) : null}
              </dl>

              {showContacts ? (
                <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                  <Link
                    href={buildOrganizerBookingMessageHref(booking.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:bg-gray-50"
                  >
                    <MessageCircle className="h-4 w-4 text-slate" />
                    Сообщения в кабинете
                  </Link>
                  <a
                    href={`mailto:${booking.contactEmail}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:bg-gray-50"
                  >
                    <Mail className="h-4 w-4 text-slate" />
                    Email
                  </a>
                  <a
                    href={`tel:${booking.contactPhone}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:bg-gray-50"
                  >
                    <Phone className="h-4 w-4 text-slate" />
                    Позвонить
                  </a>
                </div>
              ) : null}

              <BookingOrganizerCommentsEditor
                bookingId={booking.id}
                comments={booking.organizerComments}
                authorName={user?.fullName ?? "Организатор"}
                variant="organizer-detail"
                onUpdated={() => setBooking(getBookingById(bookingId) ?? null)}
              />
            </div>
          </article>

          <article className="rounded-3xl bg-white px-5 py-4 shadow-sm ring-1 ring-gray-200/60 sm:px-6">
            <button
              type="button"
              onClick={() => setHistoryOpen((open) => !open)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <span className="font-heading text-base font-bold text-charcoal">История статусов</span>
              {historyOpen ? (
                <ChevronUp className="h-5 w-5 text-slate" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate" />
              )}
            </button>
            {historyOpen ? (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <BookingStatusTimeline history={booking.statusHistory} />
              </div>
            ) : null}
          </article>

          <BookingTravelersOrganizerSection booking={booking} sectionId="booking-travelers-section" />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-[calc(var(--site-header-height,72px)+1rem)]">
          {(primaryAction || secondaryConfirmAction || cancelAction || completeAction) && (
            <article className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-200/60">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate">
                Заявка №{displayNumber}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-charcoal">{statusMeta.actionHint}</p>

              <div className="mt-4 space-y-2">
                {primaryAction === "pending" ? (
                  <Button
                    type="button"
                    className="h-12 w-full rounded-2xl bg-brand text-base font-semibold hover:bg-brand-dark"
                    disabled={statusLoading}
                    onClick={() => handleStatusChange("pending")}
                  >
                    <Clock3 className="h-5 w-5" />
                    Взять в обработку
                  </Button>
                ) : null}

                {primaryAction === "confirmed" ? (
                  <Button
                    type="button"
                    className="h-12 w-full rounded-2xl bg-brand text-base font-semibold hover:bg-brand-dark"
                    disabled={statusLoading}
                    onClick={() => handleStatusChange("confirmed")}
                  >
                    <Check className="h-5 w-5" />
                    Подтвердить
                  </Button>
                ) : null}

                {secondaryConfirmAction ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full rounded-2xl text-base font-semibold"
                    disabled={statusLoading}
                    onClick={() => handleStatusChange("confirmed")}
                  >
                    <Check className="h-5 w-5" />
                    Подтвердить сразу
                  </Button>
                ) : null}

                {completeAction ? (
                  <Button
                    type="button"
                    className="h-12 w-full rounded-2xl bg-brand text-base font-semibold hover:bg-brand-dark"
                    disabled={statusLoading}
                    onClick={() => handleStatusChange("completed")}
                  >
                    <BadgeCheck className="h-5 w-5" />
                    Завершить поездку
                  </Button>
                ) : null}

                {cancelAction ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 w-full rounded-2xl text-base font-semibold"
                    disabled={statusLoading}
                    onClick={() => handleStatusChange("cancelled")}
                  >
                    <X className="h-5 w-5" />
                    Отменить
                  </Button>
                ) : null}
              </div>

              {statusError ? (
                <p role="alert" className="mt-3 text-sm text-red-600">
                  {statusError}
                </p>
              ) : null}
            </article>
          )}

          <BookingOrganizerDataPanel booking={booking} currentStatus={currentStatus} />
        </aside>
      </div>
    </div>
  );
}
