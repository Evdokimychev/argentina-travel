"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  Circle,
  CircleDot,
  ExternalLink,
  Link2,
  Loader2,
  MapPin,
  Plane,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getBookingByClientPortalToken,
  submitTripClientRequirements,
} from "@/lib/bookings-store";
import { computeTripProgress } from "@/lib/trip-operations";
import { formatBookingTourDates } from "@/lib/booking-display";
import { BOOKINGS_UPDATED_EVENT, type Booking } from "@/types/tourist";
import {
  BOOKING_SOURCE_LABELS,
  TRIP_TASK_CATEGORY_LABELS,
  TRIP_TASK_STATUS_LABELS,
  type TripClientRequirements,
  type TripTaskStatus,
} from "@/types/trip-operations";
import { cn } from "@/lib/cn";

function clientTaskIcon(status: TripTaskStatus) {
  if (status === "done") return Check;
  if (status === "in_progress") return CircleDot;
  return Circle;
}

export default function TripClientPortalView({ token }: { token: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [requirements, setRequirements] = useState<TripClientRequirements>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function load() {
      const found = getBookingByClientPortalToken(token);
      setBooking(found ?? null);
      if (found?.tripOperations?.clientRequirements) {
        setRequirements(found.tripOperations.clientRequirements);
        setSubmitted(Boolean(found.tripOperations.clientRequirements.submittedAt));
      }
    }
    load();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, load);
    return () => window.removeEventListener(BOOKINGS_UPDATED_EVENT, load);
  }, [token]);

  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-slate">Ссылка недействительна или поездка не найдена.</p>
        <Link href="/tours" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
          Перейти к турам
        </Link>
      </div>
    );
  }

  const operations = booking.tripOperations;
  const clientTasks = (operations?.tasks ?? []).filter((task) => task.clientVisible);
  const clientLinks = (operations?.resourceLinks ?? []).filter((link) => link.clientVisible);
  const clientUpdates = operations?.clientUpdates ?? [];
  const progress = computeTripProgress(operations);
  const sourceLabel =
    booking.bookingSource && booking.bookingSource !== "platform"
      ? BOOKING_SOURCE_LABELS[booking.bookingSource]
      : null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = submitTripClientRequirements({ token, requirements });
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setBooking(result.booking);
    setRequirements(result.booking.tripOperations?.clientRequirements ?? requirements);
    setSubmitted(true);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-200/60">
        <div className="relative h-40 sm:h-48">
          <Image src={booking.tourImage} alt="" fill className="object-cover" sizes="768px" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
              Ваша поездка
            </p>
            <h1 className="mt-1 font-display text-xl font-bold text-white sm:text-2xl">
              {booking.tourTitle}
            </h1>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          <div className="flex flex-wrap gap-3 text-sm text-slate">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1">
              <MapPin className="h-3.5 w-3.5" />
              {formatBookingTourDates(booking, "Даты уточняются")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1">
              {booking.guests} {booking.guests === 1 ? "гость" : booking.guests < 5 ? "гостя" : "гостей"}
            </span>
            {sourceLabel ? (
              <span className="rounded-full bg-sky/10 px-3 py-1 text-sky-dark">
                Бронирование: {sourceLabel}
                {booking.externalReference ? ` · ${booking.externalReference}` : ""}
              </span>
            ) : null}
          </div>

          {clientUpdates.length > 0 ? (
            <section>
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-sky" aria-hidden />
                <h2 className="font-heading text-lg font-bold text-charcoal">Обновления</h2>
              </div>
              <ul className="mt-3 space-y-2">
                {clientUpdates.map((update) => (
                  <li
                    key={update.id}
                    className="rounded-2xl border border-sky/15 bg-sky/5 px-4 py-3"
                  >
                    <p className="text-sm text-charcoal">{update.message}</p>
                    <time
                      dateTime={update.createdAt}
                      className="mt-1 block text-xs text-slate"
                    >
                      {new Date(update.createdAt).toLocaleString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {clientTasks.length > 0 ? (
            <section>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-heading text-lg font-bold text-charcoal">Подготовка поездки</h2>
                <span className="text-sm text-slate">
                  {progress.clientDone}/{progress.clientTotal}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-sky transition-all"
                  style={{ width: `${progress.clientPercent}%` }}
                />
              </div>
              <ul className="mt-4 space-y-2">
                {clientTasks.map((task) => {
                  const Icon = clientTaskIcon(task.status);
                  return (
                    <li
                      key={task.id}
                      className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-3"
                    >
                      <Icon
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          task.status === "done"
                            ? "text-sky-dark"
                            : task.status === "in_progress"
                              ? "text-sky-600"
                              : "text-slate"
                        )}
                      />
                      <div>
                        <p className="text-sm font-medium text-charcoal">{task.title}</p>
                        <p className="mt-0.5 text-xs text-slate">
                          {TRIP_TASK_CATEGORY_LABELS[task.category]} ·{" "}
                          {TRIP_TASK_STATUS_LABELS[task.status]}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {clientLinks.length > 0 ? (
            <section>
              <h2 className="font-heading text-lg font-bold text-charcoal">Материалы и ссылки</h2>
              <ul className="mt-3 space-y-2">
                {clientLinks.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-2xl border border-gray-100 px-4 py-3 text-sm font-medium text-sky transition-colors hover:bg-sky-50"
                    >
                      <Link2 className="h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1">{link.title}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-50" />
                    </a>
                    {link.description ? (
                      <p className="mt-1 px-1 text-xs text-slate">{link.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-2xl border border-gray-100 bg-pampas/80 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
                <Plane className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-lg font-bold text-charcoal">
                  Ваши данные для организации
                </h2>
                <p className="mt-1 text-sm text-slate">
                  Укажите рейсы, отель и особенности — организатор использует это для билетов и
                  логистики.
                </p>
              </div>
            </div>

            {submitted && requirements.submittedAt ? (
              <div className="mt-4 rounded-xl bg-sky/10 px-4 py-3 text-sm text-sky-dark">
                Анкета отправлена. При необходимости вы можете обновить данные ниже.
              </div>
            ) : null}

            <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="flight-arrival" className="text-xs font-medium text-charcoal">
                    Прилёт (рейс, время, аэропорт)
                  </label>
                  <Input
                    id="flight-arrival"
                    value={requirements.flightArrival ?? ""}
                    onChange={(event) =>
                      setRequirements((prev) => ({ ...prev, flightArrival: event.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="flight-departure" className="text-xs font-medium text-charcoal">
                    Вылет
                  </label>
                  <Input
                    id="flight-departure"
                    value={requirements.flightDeparture ?? ""}
                    onChange={(event) =>
                      setRequirements((prev) => ({ ...prev, flightDeparture: event.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="hotel-name" className="text-xs font-medium text-charcoal">
                    Отель
                  </label>
                  <Input
                    id="hotel-name"
                    value={requirements.hotelName ?? ""}
                    onChange={(event) =>
                      setRequirements((prev) => ({ ...prev, hotelName: event.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="hotel-address" className="text-xs font-medium text-charcoal">
                    Адрес отеля
                  </label>
                  <Input
                    id="hotel-address"
                    value={requirements.hotelAddress ?? ""}
                    onChange={(event) =>
                      setRequirements((prev) => ({ ...prev, hotelAddress: event.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="hotel-checkin" className="text-xs font-medium text-charcoal">
                    Заезд
                  </label>
                  <Input
                    id="hotel-checkin"
                    type="date"
                    value={requirements.hotelCheckIn ?? ""}
                    onChange={(event) =>
                      setRequirements((prev) => ({ ...prev, hotelCheckIn: event.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="hotel-checkout" className="text-xs font-medium text-charcoal">
                    Выезд
                  </label>
                  <Input
                    id="hotel-checkout"
                    type="date"
                    value={requirements.hotelCheckOut ?? ""}
                    onChange={(event) =>
                      setRequirements((prev) => ({ ...prev, hotelCheckOut: event.target.value }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="dietary" className="text-xs font-medium text-charcoal">
                  Особенности питания
                </label>
                <Input
                  id="dietary"
                  value={requirements.dietaryRestrictions ?? ""}
                  onChange={(event) =>
                    setRequirements((prev) => ({
                      ...prev,
                      dietaryRestrictions: event.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="special" className="text-xs font-medium text-charcoal">
                  Пожелания и комментарии
                </label>
                <textarea
                  id="special"
                  rows={3}
                  value={requirements.specialRequests ?? ""}
                  onChange={(event) =>
                    setRequirements((prev) => ({ ...prev, specialRequests: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
              </div>

              {error ? (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              ) : null}

              <Button type="submit" disabled={submitting} className="rounded-2xl">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Отправка…
                  </>
                ) : submitted ? (
                  "Обновить данные"
                ) : (
                  "Отправить организатору"
                )}
              </Button>
            </form>
          </section>

          <p className="text-center text-xs text-slate">
            Организатор: {booking.contactName ? "ваш гид" : "Пора в Аргентину"} · вопросы — по
            контактам из письма с бронированием
          </p>
        </div>
      </div>
    </div>
  );
}
