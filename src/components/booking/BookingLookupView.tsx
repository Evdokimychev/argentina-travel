"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BookingPaymentStatusBadge from "@/components/booking/BookingPaymentStatusBadge";
import BookingStatusBadge from "@/components/booking/BookingStatusBadge";
import FormattedPrice from "@/components/FormattedPrice";
import { formatBookingDisplayNumber, formatBookingTourDates } from "@/lib/booking-display";
import {
  apiFetchBookingLookupResults,
  apiRequestBookingLookup,
  apiVerifyBookingLookup,
  type BookingLookupSummary,
} from "@/lib/bookings-api";

type Step = "email" | "code" | "results";

export default function BookingLookupView() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [requestId, setRequestId] = useState("");
  const [results, setResults] = useState<BookingLookupSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestCode(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequestBookingLookup(email);
      setRequestId(response.requestId ?? "");
      setMessage(response.message);
      setStep("code");
    } catch {
      setError("Не удалось отправить код. Попробуйте немного позже.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    if (!requestId) {
      setError("Запросите новый код доступа.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiVerifyBookingLookup(requestId, code);
      setResults(await apiFetchBookingLookupResults());
      setStep("results");
    } catch {
      setError("Код неверен или истёк. Запросите новый код.");
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    setStep("email");
    setCode("");
    setRequestId("");
    setResults([]);
    setMessage(null);
    setError(null);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-2xl font-bold text-charcoal">Найти заявку</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          Доступ защищён одноразовым кодом. Мы отправим его на email, указанный при бронировании.
        </p>

        {step === "email" ? (
          <form onSubmit={requestCode} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-charcoal" htmlFor="booking-email">
              Email из заявки
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" aria-hidden />
              <Input id="booking-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="pl-10" required />
            </div>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Mail className="h-4 w-4" aria-hidden />}
              Получить код
            </Button>
          </form>
        ) : null}

        {step === "code" ? (
          <form onSubmit={verifyCode} className="mt-6 space-y-4">
            {message ? <p className="rounded-lg bg-sky/10 px-4 py-3 text-sm text-charcoal">{message}</p> : null}
            <label className="block text-sm font-medium text-charcoal" htmlFor="booking-code">
              Код из письма
            </label>
            <div className="relative max-w-xs">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" aria-hidden />
              <Input id="booking-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} className="pl-10 text-lg tracking-widest" required />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={loading || code.length !== 6}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <KeyRound className="h-4 w-4" aria-hidden />}
                Открыть заявки
              </Button>
              <Button type="button" variant="outline" onClick={restart}>Другой email</Button>
            </div>
          </form>
        ) : null}

        {error ? <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

        {step === "results" ? (
          <div className="mt-7">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-charcoal">Ваши заявки</h2>
              <Button type="button" variant="outline" size="sm" onClick={restart}>Закрыть доступ</Button>
            </div>
            {results.length ? (
              <ul className="mt-4 space-y-4">
                {results.map((booking) => (
                  <li key={booking.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate">№{formatBookingDisplayNumber(booking.id)}</p>
                        <p className="font-medium text-charcoal">{booking.tourTitle}</p>
                        <p className="mt-1 text-sm text-slate">{formatBookingTourDates(booking, "Даты по согласованию")}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <BookingStatusBadge status={booking.status} />
                        <BookingPaymentStatusBadge status={booking.paymentStatus ?? "pending"} />
                      </div>
                    </div>
                    <FormattedPrice priceUsd={booking.totalPriceUsd} className="mt-3 font-semibold" />
                  </li>
                ))}
              </ul>
            ) : <p className="mt-4 text-sm text-slate">Доступных заявок нет.</p>}
          </div>
        ) : null}

        <p className="mt-8 border-t border-gray-100 pt-5 text-sm text-slate">
          Для постоянного доступа используйте <Link href="/profile" className="font-medium text-brand hover:underline">личный кабинет</Link>.
        </p>
      </section>
    </main>
  );
}
