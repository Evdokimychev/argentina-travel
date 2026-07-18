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
import InlineFeedback from "@/components/feedback/InlineFeedback";
import { useSiteFeedback } from "@/context/SiteFeedbackContext";
import { normalizeSiteError, siteFormError } from "@/lib/site-feedback/normalize-error";
import type { SiteFeedbackMessage } from "@/types/site-feedback";
import { isRemoteBookingsMode } from "@/lib/bookings-api";
import {
  apiFetchTravelersFormBooking,
  apiSaveTravelersFormBooking,
} from "@/lib/booking-travelers-api";
import type { TravelersFormBookingView } from "@/lib/booking-travelers-server";
import { cn } from "@/lib/cn";

export default function BookingTravelersFormView({ token }: { token: string }) {
  const remoteBookings = isRemoteBookingsMode();
  const [booking, setBooking] = useState<TravelersFormBookingView | null>(null);
  const [travelers, setTravelers] = useState<BookingTraveler[]>([]);
  const [consent, setConsent] = useState(false);
  const [dateErrors, setDateErrors] = useState<Record<string, string>>({});
  const [error, setErrorState] = useState<SiteFeedbackMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const feedback = useSiteFeedback();

  const setError = (value: string | SiteFeedbackMessage | null) => {
    if (value === null) {
      setErrorState(null);
      return;
    }
    setErrorState(typeof value === "string" ? siteFormError(value) : value);
  };

  useEffect(() => {
    async function load() {
      setInitialLoading(true);
      try {
        const found = remoteBookings
          ? await apiFetchTravelersFormBooking(token)
          : getBookingByTravelersToken(token) ?? null;
        setBooking(found);
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
      } catch (loadError) {
        setBooking(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Не удалось загрузить заявку. Обновите страницу и попробуйте ещё раз."
        );
      } finally {
        setInitialLoading(false);
      }
    }

    void load();
    const onUpdated = () => void load();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(BOOKINGS_UPDATED_EVENT, onUpdated);
  }, [remoteBookings, token]);

  if (initialLoading) {
    return <p className="py-16 text-center text-sm text-slate" role="status">Загружаем заявку…</p>;
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-slate">
          {error?.description ?? "Ссылка недействительна или заявка не найдена."}
        </p>
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextDateErrors = Object.fromEntries(
      travelers
        .filter((traveler) => !traveler.dateOfBirth.trim())
        .map((traveler) => [traveler.id, "Укажите дату рождения"])
    );

    if (Object.keys(nextDateErrors).length > 0) {
      setDateErrors(nextDateErrors);
      const firstInvalidTraveler = travelers.find((traveler) => nextDateErrors[traveler.id]);
      if (firstInvalidTraveler) {
        document.getElementById(`dob-${firstInvalidTraveler.id}`)?.focus();
      }
      return;
    }

    setDateErrors({});
    if (!consent) {
      setError("Подтвердите согласие на обработку персональных данных");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextBooking = remoteBookings
        ? await apiSaveTravelersFormBooking(token, travelers)
        : (() => {
            const result = submitBookingTravelers({ token, travelers });
            if ("error" in result) throw new Error(result.error);
            return result.booking as Booking;
          })();
      setBooking(nextBooking);
      setTravelers(nextBooking.travelers ?? []);
      setSubmitted(true);
      window.dispatchEvent(new CustomEvent(BOOKINGS_UPDATED_EVENT));
      feedback.success({
        title: "Данные отправлены",
        description: "Информация о участниках передана организатору тура.",
      });
    } catch (submitError) {
      const normalized = normalizeSiteError(
        submitError instanceof Error ? submitError.message : "Не удалось отправить данные",
        {
        title: "Не удалось отправить данные",
        steps: ["Проверьте ФИО, дату рождения и телефон каждого участника", "Подтвердите согласие на обработку данных"],
        }
      );
      setError(normalized);
      feedback.showError(normalized);
    } finally {
      setLoading(false);
    }
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

              <div className={cn("grid gap-3", !remoteBookings && "sm:grid-cols-2")}>
                <div
                  role="group"
                  aria-describedby={dateErrors[traveler.id] ? `dob-${traveler.id}-error` : undefined}
                >
                  <label className="mb-1.5 block text-sm text-slate" htmlFor={`dob-${traveler.id}`}>
                    Дата рождения <span className="text-brand" aria-hidden="true">*</span>
                    <span className="sr-only"> (обязательное поле)</span>
                  </label>
                  <SingleDatePicker
                    id={`dob-${traveler.id}`}
                    value={parseBookingTravelerDate(traveler.dateOfBirth)}
                    onChange={(date) => {
                      updateTraveler(index, { dateOfBirth: formatBookingTravelerDate(date) });
                      if (date) {
                        setDateErrors((current) => {
                          if (!current[traveler.id]) return current;
                          const next = { ...current };
                          delete next[traveler.id];
                          return next;
                        });
                      }
                    }}
                    min={minBirthDateIso()}
                    max={maxBirthDateIso()}
                    birthDatePicker
                    placeholder="ДД.ММ.ГГГГ"
                    className={dateErrors[traveler.id]
                      ? "h-11 rounded-xl border-error bg-error-muted ring-2 ring-error/20"
                      : "h-11 rounded-xl bg-gray-50"}
                  />
                  {dateErrors[traveler.id] ? (
                    <p
                      id={`dob-${traveler.id}-error`}
                      role="alert"
                      className="mt-1.5 text-xs font-medium text-error"
                    >
                      {dateErrors[traveler.id]}
                    </p>
                  ) : null}
                  {participantAgeLabel(parseBookingTravelerDate(traveler.dateOfBirth)) ? (
                    <p className="mt-1.5 text-xs text-slate">
                      Возраст: {participantAgeLabel(parseBookingTravelerDate(traveler.dateOfBirth))}
                    </p>
                  ) : null}
                </div>
                {!remoteBookings ? (
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
                ) : null}
              </div>

              {remoteBookings ? (
                <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm leading-relaxed text-slate">
                  Паспортные данные на сайте не запрашиваются. Если они понадобятся для конкретной
                  услуги, организатор отдельно объяснит безопасный способ передачи.
                </p>
              ) : null}

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
          <InlineFeedback
            variant="error"
            title={error.title}
            description={error.description}
            steps={error.steps}
            action={error.action}
          />
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
          loading={loading}
          loadingLabel="Отправляем…"
          className="h-12 w-full rounded-2xl bg-brand text-base font-semibold hover:bg-brand-dark"
        >
          Отправить
        </Button>
      </form>
    </div>
  );
}
