"use client";

import { useEffect, useState } from "react";
import { siteScrollAnchorClass } from "@/lib/site-container";
import { Copy, Link2, Users } from "lucide-react";
import type { Booking } from "@/types/tourist";
import {
  buildTravelersFormUrl,
  hasCompleteBookingTravelers,
  needsBookingTravelersForm,
} from "@/lib/booking-travelers";
import { formatBookingCreatedAt } from "@/lib/booking-datetime";
import { formatDateShortWithYear } from "@/lib/utils";
import { BOOKINGS_UPDATED_EVENT } from "@/types/tourist";
import { Button } from "@/components/ui/button";

function formatTravelerBirthDate(value: string): string {
  if (!value) return "—";
  try {
    return formatDateShortWithYear(value);
  } catch {
    return value;
  }
}

export default function BookingTravelersOrganizerSection({
  booking,
  sectionId,
}: {
  booking: Booking;
  sectionId?: string;
}) {
  const [formUrl, setFormUrl] = useState("");
  const [copied, setCopied] = useState(false);

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

  const isComplete = hasCompleteBookingTravelers(booking);
  const needsForm = needsBookingTravelersForm(booking);

  return (
    <article
      id={sectionId}
      className={`rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-200/60 sm:p-6 ${siteScrollAnchorClass}`}
    >
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-slate" />
        <h2 className="font-display text-base font-bold text-charcoal">Информация о туристах</h2>
      </div>
      <p className="mt-3 text-sm text-slate">
        {booking.guests} {booking.guests === 1 ? "участник" : "участника"} · контактное лицо{" "}
        <span className="font-medium text-charcoal">{booking.contactName}</span>
      </p>

      {isComplete && booking.travelers ? (
        <div className="mt-4 space-y-4">
          <p className="text-xs text-slate">
            Данные заполнены{" "}
            {booking.travelersCompletedAt
              ? formatBookingCreatedAt(booking.travelersCompletedAt)
              : ""}
          </p>
          <ul className="space-y-3">
            {booking.travelers.slice(0, booking.guests).map((traveler, index) => (
              <li
                key={traveler.id}
                className="rounded-2xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm"
              >
                <p className="font-semibold text-charcoal">
                  Турист #{index + 1}: {traveler.fullName}
                </p>
                <dl className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-slate">Дата рождения</dt>
                    <dd className="font-medium text-charcoal">
                      {formatTravelerBirthDate(traveler.dateOfBirth)}
                    </dd>
                  </div>
                  {traveler.passportNumber ? (
                    <div>
                      <dt className="text-xs text-slate">Паспорт</dt>
                      <dd className="font-medium text-charcoal">{traveler.passportNumber}</dd>
                    </div>
                  ) : null}
                  {traveler.dietaryRestrictions ? (
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-slate">Питание</dt>
                      <dd className="font-medium text-charcoal">{traveler.dietaryRestrictions}</dd>
                    </div>
                  ) : null}
                  {traveler.email ? (
                    <div>
                      <dt className="text-xs text-slate">Email</dt>
                      <dd className="font-medium text-charcoal">{traveler.email}</dd>
                    </div>
                  ) : null}
                  {traveler.phone ? (
                    <div>
                      <dt className="text-xs text-slate">Телефон</dt>
                      <dd className="font-medium text-charcoal">{traveler.phone}</dd>
                    </div>
                  ) : null}
                </dl>
              </li>
            ))}
          </ul>
        </div>
      ) : needsForm ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl bg-rose-50/80 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-100">
            {booking.fillTravelersLater
              ? "Турист выбрал заполнить данные участников позже. Отправьте ссылку на форму."
              : "Данные участников ещё не заполнены."}
          </div>

          {formUrl ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-charcoal">
                <Link2 className="h-4 w-4 text-slate" />
                Отправить форму туристу
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  readOnly
                  value={formUrl}
                  className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-charcoal"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                  {copied ? "Скопировано" : "Копировать"}
                </Button>
              </div>
              <a
                href={formUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-sm font-medium text-brand hover:underline"
              >
                Открыть форму
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
