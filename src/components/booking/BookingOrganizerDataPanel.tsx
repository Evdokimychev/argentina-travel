"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  FileText,
  PencilLine,
  Users,
} from "lucide-react";
import type { Booking, BookingStatusActive } from "@/types/tourist";
import { BOOKINGS_UPDATED_EVENT } from "@/types/tourist";
import {
  ORGANIZER_BOOKING_DATA_BADGE,
} from "@/data/organizer-booking-detail";
import { formatBookingCreatedAt } from "@/lib/booking-datetime";
import { canOrganizerSeeContactDetails, formatBookingCheckoutPaymentOption, formatBookingDisplayNumber, formatBookingTourDates } from "@/lib/booking-display";
import {
  buildTravelersFormUrl,
  getTravelersSummaryText,
  hasCompleteBookingTravelers,
  needsBookingTravelersForm,
} from "@/lib/booking-travelers";
import BookingLedgerAmount from "@/components/booking/BookingLedgerAmount";
import BookingOrganizerInvoicesSection from "@/components/booking/BookingOrganizerInvoicesSection";
import BookingOrganizerEditModal from "@/components/booking/BookingOrganizerEditModal";
import { shouldShowBookingInvoices } from "@/lib/booking-payment";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

function DataBlockRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-gray-200/80 py-3 last:border-b-0 last:pb-0 first:pt-0">
      <p className="text-xs font-medium text-slate">{label}</p>
      <div className="mt-1 text-sm leading-snug text-charcoal">{children}</div>
    </div>
  );
}

export default function BookingOrganizerDataPanel({
  booking,
  currentStatus,
}: {
  booking: Booking;
  currentStatus: BookingStatusActive;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [formUrl, setFormUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const displayNumber = formatBookingDisplayNumber(booking.id);
  const badge = ORGANIZER_BOOKING_DATA_BADGE[currentStatus];
  const showContacts = canOrganizerSeeContactDetails(booking.status);
  const travelersComplete = hasCompleteBookingTravelers(booking);
  const travelersPending = needsBookingTravelersForm(booking);
  const isDraft = currentStatus === "new" || currentStatus === "pending";

  useEffect(() => {
    if (booking.travelersFormToken) {
      setFormUrl(buildTravelersFormUrl(booking.travelersFormToken));
    }
  }, [booking.travelersFormToken]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    function refreshUrl() {
      if (booking.travelersFormToken) {
        setFormUrl(buildTravelersFormUrl(booking.travelersFormToken));
      }
    }
    window.addEventListener(BOOKINGS_UPDATED_EVENT, refreshUrl);
    return () => window.removeEventListener(BOOKINGS_UPDATED_EVENT, refreshUrl);
  }, [booking.travelersFormToken]);

  async function handleCopyLink() {
    if (!formUrl) return;
    try {
      await navigator.clipboard.writeText(formUrl);
      setCopied(true);
    } catch {
      /* ignore */
    }
  }

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-200/60">
      <div className="flex items-start justify-between gap-2 border-b border-gray-100 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <FileText className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <h3 className="font-heading text-base font-bold leading-tight text-charcoal">
            Данные о бронировании
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate transition-colors hover:bg-gray-100 hover:text-charcoal"
            aria-label="Редактировать параметры бронирования"
          >
            <PencilLine className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((open) => !open)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate transition-colors hover:bg-gray-100 hover:text-charcoal"
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Развернуть блок" : "Свернуть блок"}
          >
            {collapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {!collapsed ? (
        <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
          <div>
            <p className="text-sm text-charcoal">
              Бронирование по заявке №{displayNumber}
            </p>
            <span
              className={cn(
                "mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                badge.className
              )}
            >
              {badge.label}
            </span>
          </div>

          <div className="rounded-2xl bg-gray-50 px-4 py-3 ring-1 ring-gray-100">
            <DataBlockRow label="Заказчик">
              {showContacts ? (
                <span className="font-medium">{booking.contactName}</span>
              ) : (
                <span className="text-slate">Контакт будет доступен после перевода в обработку</span>
              )}
            </DataBlockRow>

            <DataBlockRow label="Туристы">
              {travelersComplete ? (
                <span className="font-medium">{getTravelersSummaryText(booking)}</span>
              ) : (
                <span className="text-slate">{getTravelersSummaryText(booking)}</span>
              )}
            </DataBlockRow>

            <DataBlockRow label="Даты поездки">
              <span className={booking.startDate ? "font-medium" : "text-slate"}>
                {formatBookingTourDates(booking)}
              </span>
            </DataBlockRow>

            <DataBlockRow label="Сумма бронирования">
              <BookingLedgerAmount booking={booking} priceUsd={booking.totalPriceUsd} />
            </DataBlockRow>

            {booking.metadata?.checkoutCurrency ? (
              <DataBlockRow label="Валюта оформления">
                <span className="font-medium">{booking.metadata.checkoutCurrency}</span>
              </DataBlockRow>
            ) : null}

            {booking.checkoutPaymentOption ? (
              <DataBlockRow label="Способ оплаты">
                <span className="font-medium">
                  {formatBookingCheckoutPaymentOption(booking.checkoutPaymentOption)}
                </span>
              </DataBlockRow>
            ) : null}
          </div>

          {shouldShowBookingInvoices(currentStatus) ? (
            <BookingOrganizerInvoicesSection booking={booking} />
          ) : null}

          <div className="rounded-2xl bg-sky/5 px-4 py-4 ring-1 ring-sky/10">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-sky" />
              <p className="text-sm font-semibold text-charcoal">Участники поездки</p>
            </div>

            {travelersComplete ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate">
                  Заполнено{" "}
                  {booking.travelersCompletedAt
                    ? formatBookingCreatedAt(booking.travelersCompletedAt)
                    : ""}
                </p>
                <ul className="space-y-1.5 text-sm">
                  {booking.travelers?.slice(0, booking.guests).map((traveler, index) => (
                    <li key={traveler.id} className="text-charcoal">
                      <span className="font-medium">
                        {index + 1}. {traveler.fullName}
                      </span>
                      {traveler.passportNumber ? (
                        <span className="text-slate"> · паспорт {traveler.passportNumber}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : travelersPending && formUrl ? (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-slate">
                  Отправьте туристу ссылку на форму для заполнения данных участников.
                </p>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    readOnly
                    value={formUrl}
                    className="w-full rounded-xl border border-sky/15 bg-white px-3 py-2 text-xs text-charcoal"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleCopyLink}>
                      <Copy className="h-3.5 w-3.5" />
                      {copied ? "Скопировано" : "Копировать ссылку"}
                    </Button>
                    <Link
                      href={formUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center rounded-xl border border-gray-200 bg-white px-3 text-xs font-semibold text-charcoal hover:bg-gray-50"
                    >
                      Открыть форму
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate">
                {isDraft
                  ? "Полный состав участников появится после подтверждения заявки."
                  : "Ожидаем данные участников."}
              </p>
            )}
          </div>
        </div>
      ) : null}

      <BookingOrganizerEditModal
        booking={booking}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </article>
  );
}
