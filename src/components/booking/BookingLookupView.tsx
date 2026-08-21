"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SmartInput } from "@/components/ui/smart-input";
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
import { validateBookingCode, validateEmail } from "@/lib/form-validation";

type Step = "email" | "code" | "results";

export default function BookingLookupView() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [requestId, setRequestId] = useState("");
  const [results, setResults] = useState<BookingLookupSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => setResendCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  async function sendCode() {
    setLoading(true);
    setEmailError(null);
    setCodeError(null);
    try {
      const response = await apiRequestBookingLookup(email);
      setRequestId(response.requestId ?? "");
      setMessage(response.message);
      setStep("code");
      setResendCooldown(60);
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Не удалось отправить код. Проверьте email или попробуйте немного позже.";
      if (step === "code") setCodeError(message);
      else setEmailError(message);
    } finally {
      setLoading(false);
    }
  }

  async function requestCode(event: React.FormEvent) {
    event.preventDefault();
    await sendCode();
  }

  async function verifyCode(event: React.FormEvent) {
    event.preventDefault();
    if (!requestId) {
      setCodeError("Запросите новый код доступа.");
      return;
    }
    setLoading(true);
    setCodeError(null);
    try {
      await apiVerifyBookingLookup(requestId, code);
      setResults(await apiFetchBookingLookupResults());
      setStep("results");
    } catch {
      setCodeError("Код неверен или истёк. Запросите новый код.");
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
    setEmailError(null);
    setCodeError(null);
    setResendCooldown(0);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-2xl font-bold text-charcoal">Найти заявку</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          Доступ защищён одноразовым кодом. Мы отправим его на email, указанный при бронировании.
        </p>

        {step === "email" ? (
          <form onSubmit={requestCode} className="mt-6 space-y-4">
            <SmartInput id="booking-email" label="Email из заявки" type="email" inputMode="email" enterKeyHint="send" autoComplete="email" value={email} onValueChange={(value) => { setEmail(value); setEmailError(null); }} error={emailError} validate={validateEmail} leadingIcon={<Mail className="h-4 w-4" />} clearable required showValidationSuccess={false} />
            <Button type="submit" loading={loading} loadingLabel="Отправляем код…" className="w-full sm:w-auto">
              <Mail className="h-4 w-4" aria-hidden />
              Получить код
            </Button>
          </form>
        ) : null}

        {step === "code" ? (
          <form onSubmit={verifyCode} className="mt-6 space-y-4">
            {message ? <p className="rounded-lg bg-sky/10 px-4 py-3 text-sm text-charcoal">{message}</p> : null}
            <div className="max-w-xs">
              <SmartInput id="booking-code" label="Код из письма" inputMode="numeric" enterKeyHint="done" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onValueChange={(value) => { setCode(value.replace(/\D/g, "")); setCodeError(null); }} error={codeError} validate={validateBookingCode} leadingIcon={<KeyRound className="h-4 w-4" />} className="text-lg tracking-widest" required />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={code.length !== 6} loading={loading} loadingLabel="Проверяем код…">
                <KeyRound className="h-4 w-4" aria-hidden />
                Открыть заявки
              </Button>
              <Button type="button" variant="outline" onClick={restart}>Другой email</Button>
              <Button type="button" variant="ghost" disabled={loading || resendCooldown > 0} onClick={() => void sendCode()}>
                {resendCooldown > 0 ? `Отправить снова через ${resendCooldown} с` : "Отправить код снова"}
              </Button>
            </div>
          </form>
        ) : null}

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
    </div>
  );
}
