"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PhoneCountryInput from "@/components/auth/PhoneCountryInput";
import SingleDatePicker from "@/components/ui/single-date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatBookingDisplayNumber } from "@/lib/booking-display";
import {
  createEmptyBookingTraveler,
  ensureTravelersSlotCount,
  formatBookingTravelerDate,
  parseBookingTravelerDate,
} from "@/lib/booking-travelers";
import {
  getBookingByTravelersToken,
  submitBookingTravelers,
} from "@/lib/bookings-store";
import { maxBirthDateIso, minBirthDateIso, participantAgeLabel } from "@/lib/participant-age";
import type { Booking, BookingTraveler } from "@/types/tourist";
import { BOOKINGS_UPDATED_EVENT } from "@/types/tourist";

export default function BookingTravelersFormView({ token }: { token: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [travelers, setTravelers] = useState<BookingTraveler[]>([]);
  const [consent, setConsent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    function load() {
      const found = getBookingByTravelersToken(token);
      setBooking(found ?? null);
      if (found) {
        const initial = ensureTravelersSlotCount(
          found.travelers?.length ? found.travelers : [],
          found.guests
        ).map((item, index) =>
          item.fullName ? item : createEmptyBookingTraveler(`guest-${index + 1}`)
        );
        setTravelers(initial);
        setSubmitted(Boolean(found.travelersCompletedAt));
      }
    }

    load();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, load);
    return () => window.removeEventListener(BOOKINGS_UPDATED_EVENT, load);
  }, [token]);

  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-slate">Ссылка недействительна или заявка не найдена.</p>
        <Link href="/tours" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
          Перейти к турам
        </Link>
      </div>
    );
  }

  const displayNumber = formatBookingDisplayNumber(booking.id);

  function updateTraveler(index: number, patch: Partial<BookingTraveler>) {
    setTravelers((prev) =>
      prev.map((traveler, i) => (i === index ? { ...traveler, ...patch } : traveler))
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!consent) {
      setError("Подтвердите согласие на обработку персональных данных");
      return;
    }

    setLoading(true);
    setError(null);

    const result = submitBookingTravelers({ token, travelers });
    setLoading(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setBooking(result.booking);
    setTravelers(result.booking.travelers ?? []);
    setSubmitted(true);
  }

  if (submitted && booking.travelersCompletedAt) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200/60">
          <h1 className="font-display text-2xl font-bold text-charcoal">Данные отправлены</h1>
          <p className="mt-3 text-sm text-slate">
            Спасибо! Информация о участниках по заявке №{displayNumber} передана организатору тура.
          </p>
          <Link
            href={`/tours/${booking.tourSlug}`}
            className="mt-6 inline-block text-sm font-medium text-brand hover:underline"
          >
            Вернуться к туру
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="font-display text-2xl font-bold text-charcoal sm:text-3xl">
        Информация о туристах для оформления бронирования
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate">
        Пожалуйста, укажите данные всех участников поездки по созданной вами заявке №{displayNumber}{" "}
        для оформления бронирования тура «{booking.tourTitle}».
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {travelers.map((traveler, index) => (
          <section
            key={traveler.id}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <h2 className="font-heading text-base font-bold text-charcoal">Турист #{index + 1}</h2>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-sm text-slate" htmlFor={`fullName-${index}`}>
                  Фамилия, имя и отчество
                </label>
                <Input
                  id={`fullName-${index}`}
                  value={traveler.fullName}
                  onChange={(event) => updateTraveler(index, { fullName: event.target.value })}
                  placeholder="Иванов Иван Иванович"
                  className="h-11 rounded-xl bg-gray-50"
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-slate" htmlFor={`dob-${index}`}>
                    Дата рождения
                  </label>
                  <SingleDatePicker
                    id={`dob-${index}`}
                    value={parseBookingTravelerDate(traveler.dateOfBirth)}
                    onChange={(date) =>
                      updateTraveler(index, { dateOfBirth: formatBookingTravelerDate(date) })
                    }
                    min={minBirthDateIso()}
                    max={maxBirthDateIso()}
                    birthDatePicker
                    placeholder="ДД.ММ.ГГГГ"
                    className="h-11 rounded-xl bg-gray-50"
                  />
                  {participantAgeLabel(parseBookingTravelerDate(traveler.dateOfBirth)) ? (
                    <p className="mt-1.5 text-xs text-slate">
                      Возраст: {participantAgeLabel(parseBookingTravelerDate(traveler.dateOfBirth))}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-slate" htmlFor={`passport-${index}`}>
                    Номер и серия паспорта
                  </label>
                  <Input
                    id={`passport-${index}`}
                    value={traveler.passportNumber ?? ""}
                    onChange={(event) =>
                      updateTraveler(index, { passportNumber: event.target.value })
                    }
                    placeholder="4510 123456"
                    className="h-11 rounded-xl bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm text-slate" htmlFor={`diet-${index}`}>
                  Ограничения по питанию
                </label>
                <Input
                  id={`diet-${index}`}
                  value={traveler.dietaryRestrictions ?? ""}
                  onChange={(event) =>
                    updateTraveler(index, { dietaryRestrictions: event.target.value })
                  }
                  placeholder="Например: без глютена"
                  className="h-11 rounded-xl bg-gray-50"
                />
              </div>

              <p className="pt-1 text-sm text-slate">Могут потребоваться для связи с координатором тура:</p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-slate" htmlFor={`email-${index}`}>
                    Электронная почта
                  </label>
                  <Input
                    id={`email-${index}`}
                    type="email"
                    value={traveler.email ?? ""}
                    onChange={(event) => updateTraveler(index, { email: event.target.value })}
                    placeholder="email@example.com"
                    className="h-11 rounded-xl bg-gray-50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-slate" htmlFor={`phone-${index}`}>
                    Телефон
                  </label>
                  <PhoneCountryInput
                    id={`phone-${index}`}
                    value={traveler.phone ?? ""}
                    onChange={(phone) => updateTraveler(index, { phone })}
                    className="rounded-xl bg-gray-50"
                  />
                </div>
              </div>
            </div>
          </section>
        ))}

        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <label className="flex items-start gap-3 rounded-xl bg-gray-50 px-4 py-3 text-sm text-slate">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/30"
          />
          <span>
            Я принимаю условия пользовательского соглашения и даю согласие на обработку персональных
            данных в соответствии с политикой конфиденциальности
          </span>
        </label>

        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-2xl bg-brand text-base font-semibold hover:bg-brand-dark"
        >
          {loading ? "Отправляем…" : "Отправить"}
        </Button>
      </form>
    </div>
  );
}
