"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import BookingPaymentStatusBadge from "@/components/booking/BookingPaymentStatusBadge";
import FormattedPrice from "@/components/FormattedPrice";
import { formatBookingDisplayNumber, formatBookingTourDates } from "@/lib/booking-display";
import { resolveTouristPaymentLinkHref } from "@/lib/booking-payment-display";
import { getBookingsByContactEmail } from "@/lib/bookings-store";
import { useAuth } from "@/context/AuthContext";
import type { Booking } from "@/types/tourist";

export default function BookingLookupView() {
  const { user, openAuth } = useAuth();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? user?.email ?? "";
  const [email, setEmail] = useState(initialEmail);
  const [results, setResults] = useState<Booking[] | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!initialEmail.trim()) return;
    setResults(getBookingsByContactEmail(initialEmail));
    setSearched(true);
  }, [initialEmail]);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setResults(getBookingsByContactEmail(trimmed));
    setSearched(true);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-2xl font-bold text-charcoal">Найти заявку</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          Если вы оформили бронирование без входа в аккаунт, введите email, указанный при заявке.
          Заявки хранятся в браузере до подключения облачной синхронизации.
        </p>

        <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="email@example.com"
              className="pl-10"
              required
            />
          </div>
          <Button type="submit" className="shrink-0">
            Найти
          </Button>
        </form>

        {!user ? (
          <div className="mt-6 rounded-xl border border-brand/20 bg-brand-light/20 px-4 py-4 text-sm text-charcoal">
            <p className="font-medium">Создайте аккаунт, чтобы не искать заявки вручную</p>
            <p className="mt-1 text-slate">
              После регистрации с тем же email заявки автоматически появятся в личном кабинете.
            </p>
            <Button type="button" variant="outline" className="mt-3" onClick={() => openAuth()}>
              Создать аккаунт
            </Button>
          </div>
        ) : null}

        {searched && results && results.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
            <p className="font-medium text-charcoal">Заявок по этому email не найдено</p>
            <p className="mt-2 text-sm text-slate">
              Проверьте адрес или оформите новую заявку на странице тура.
            </p>
            <Link href="/tours" className="mt-4 inline-flex text-sm font-medium text-brand hover:underline">
              Выбрать тур
            </Link>
          </div>
        ) : null}

        {results && results.length > 0 ? (
          <ul className="mt-8 space-y-4">
            {results.map((booking) => {
              const payHref = resolveTouristPaymentLinkHref(booking);
              const displayNumber = formatBookingDisplayNumber(booking.id);

              return (
                <li
                  key={booking.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-slate">№{displayNumber}</p>
                      <p className="font-medium text-charcoal">{booking.tourTitle}</p>
                      <p className="mt-1 text-sm text-slate">
                        {formatBookingTourDates(booking, "Даты по согласованию")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <BookingStatusBadge status={booking.status} />
                      <BookingPaymentStatusBadge booking={booking} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <FormattedPrice priceUsd={booking.totalPriceUsd} className="font-semibold" />
                    <div className="flex flex-wrap gap-3 text-sm">
                      {user ? (
                        <Link
                          href={`/profile/bookings/${booking.id}`}
                          className="font-medium text-brand hover:underline"
                        >
                          Подробнее
                        </Link>
                      ) : null}
                      {payHref ? (
                        <Link href={payHref} className="font-medium text-brand hover:underline">
                          Оплата
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
