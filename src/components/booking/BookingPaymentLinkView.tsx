"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, CreditCard } from "lucide-react";
import FormattedPrice from "@/components/FormattedPrice";
import { formatBookingDisplayNumber } from "@/lib/booking-display";
import {
  formatBookingPaymentLinkStatus,
  isBookingPaymentLinkExpired,
} from "@/lib/booking-payment-link";
import {
  acknowledgeBookingPaymentIntent,
  getBookingByPaymentLinkToken,
  markBookingPaymentLinkOpened,
} from "@/lib/bookings-store";
import type { Booking } from "@/types/tourist";
import { BOOKINGS_UPDATED_EVENT } from "@/types/tourist";
import { Button } from "@/components/ui/button";

export default function BookingPaymentLinkView({ token }: { token: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [ackError, setAckError] = useState<string | null>(null);
  const [ackLoading, setAckLoading] = useState(false);

  useEffect(() => {
    function load() {
      const found = getBookingByPaymentLinkToken(token);
      setBooking(found ?? null);
      if (found?.paymentLink?.token === token && found.paymentLink.status === "active") {
        markBookingPaymentLinkOpened(token);
      }
    }

    load();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, load);
    return () => window.removeEventListener(BOOKINGS_UPDATED_EVENT, load);
  }, [token]);

  if (!booking?.paymentLink) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="font-medium text-charcoal">Ссылка не найдена</p>
        <p className="mt-2 text-sm text-slate">
          Ссылка на оплату недействительна или заявка была удалена. Проверьте письмо от организатора
          или найдите заявку по email.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/booking/find"
            className="inline-flex rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-charcoal hover:bg-gray-50"
          >
            Найти заявку по email
          </Link>
          <Link href="/tours" className="inline-flex text-sm font-medium text-brand hover:underline">
            Перейти к турам
          </Link>
        </div>
      </div>
    );
  }

  const link = booking.paymentLink;
  const displayNumber = formatBookingDisplayNumber(booking.id);
  const expired = isBookingPaymentLinkExpired(link);
  const paid = link.status === "paid";

  async function handleAcknowledge() {
    setAckLoading(true);
    setAckError(null);
    const result = acknowledgeBookingPaymentIntent(token);
    setAckLoading(false);

    if ("error" in result) {
      setAckError(result.error);
      return;
    }

    setAcknowledged(true);
    setBooking(result.booking);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-slate">Оплата бронирования</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-charcoal">№{displayNumber}</h1>
        <p className="mt-1 text-sm text-slate">{booking.tourTitle}</p>

        <div className="mt-6 rounded-xl bg-gray-50 px-4 py-4">
          <p className="text-sm text-slate">К оплате</p>
          <p className="mt-1 font-heading text-3xl font-bold text-charcoal">
            <FormattedPrice priceUsd={link.amountUsd} />
          </p>
          <p className="mt-2 text-xs text-slate">{formatBookingPaymentLinkStatus(link)}</p>
          {link.expiresAt && !paid && !expired ? (
            <p className="mt-1 text-xs text-slate">
              Действует до{" "}
              {new Intl.DateTimeFormat("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(new Date(link.expiresAt))}
            </p>
          ) : null}
        </div>

        {paid ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
            <div className="flex items-start gap-2">
              <Check className="mt-0.5 h-5 w-5 shrink-0" />
              <p>Оплата по этой ссылке уже получена. Спасибо!</p>
            </div>
            <Link
              href="/profile/bookings"
              className="mt-3 inline-flex text-sm font-medium text-emerald-900 underline"
            >
              Открыть в личном кабинете
            </Link>
          </div>
        ) : expired || link.status === "expired" ? (
          <div className="mt-6 space-y-3">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
              Срок действия ссылки истёк. Свяжитесь с организатором тура для получения новой ссылки
              или уточните способ оплаты напрямую.
            </div>
            <Link
              href="/contacts"
              className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-charcoal transition-colors hover:bg-gray-50"
            >
              Связаться с поддержкой
            </Link>
          </div>
        ) : link.status === "cancelled" ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            Ссылка отменена организатором. Обратитесь к организатору тура для уточнения оплаты.
          </div>
        ) : acknowledged ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
            <div className="flex items-start gap-2">
              <Check className="mt-0.5 h-5 w-5 shrink-0" />
              <p>
                Вы подтвердили готовность оплатить. Списание средств не произошло — оплата через
                платформу появится позже. Организатор свяжется с вами для уточнения деталей.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-sky-200/70 bg-sky-50/60 px-4 py-4 text-sm leading-relaxed text-charcoal">
              <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-sky" />
              <p>
                Оплата через платформу скоро. Сейчас вы видите сумму и статус счёта — карту вводить
                не нужно. Подтвердите намерение оплатить или свяжитесь с организатором.
              </p>
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={handleAcknowledge}
              disabled={ackLoading}
            >
              Подтвердить намерение оплатить
            </Button>
            {ackError ? (
              <p role="alert" className="text-sm text-red-600">
                {ackError}
              </p>
            ) : null}
            <Link
              href="/contacts"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-charcoal transition-colors hover:bg-gray-50"
            >
              Связаться с поддержкой
            </Link>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate">
          Заказчик: {booking.contactName} · {booking.contactEmail}
        </p>
      </div>
    </div>
  );
}
