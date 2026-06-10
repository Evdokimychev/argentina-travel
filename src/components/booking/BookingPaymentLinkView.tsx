"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Lock } from "lucide-react";
import FormattedPrice from "@/components/FormattedPrice";
import { formatBookingDisplayNumber } from "@/lib/booking-display";
import {
  formatBookingPaymentLinkStatus,
  isBookingPaymentLinkExpired,
} from "@/lib/booking-payment-link";
import {
  getBookingByPaymentLinkToken,
  markBookingPaymentLinkOpened,
} from "@/lib/bookings-store";
import type { Booking } from "@/types/tourist";
import { BOOKINGS_UPDATED_EVENT } from "@/types/tourist";

export default function BookingPaymentLinkView({ token }: { token: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);

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
        <p className="text-sm text-slate">Ссылка на оплату недействительна или заявка не найдена.</p>
        <Link href="/tours" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
          Перейти к турам
        </Link>
      </div>
    );
  }

  const link = booking.paymentLink;
  const displayNumber = formatBookingDisplayNumber(booking.id);
  const expired = isBookingPaymentLinkExpired(link);
  const paid = link.status === "paid";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wide text-slate">Оплата бронирования</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-charcoal">№{displayNumber}</h1>
        <p className="mt-1 text-sm text-slate">{booking.tourTitle}</p>

        <div className="mt-6 rounded-xl bg-gray-50 px-4 py-4">
          <p className="text-sm text-slate">К оплате</p>
          <p className="mt-1 font-display text-3xl font-bold text-charcoal">
            <FormattedPrice priceUsd={link.amountUsd} />
          </p>
          <p className="mt-2 text-xs text-slate">{formatBookingPaymentLinkStatus(link)}</p>
        </div>

        {paid ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
            Оплата по этой ссылке уже получена. Спасибо!
          </div>
        ) : expired || link.status === "expired" ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            Срок действия ссылки истёк. Свяжитесь с организатором тура для получения новой ссылки.
          </div>
        ) : link.status === "cancelled" ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            Ссылка отменена организатором. Обратитесь к организатору тура.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-sky-200/70 bg-sky-50/60 px-4 py-4 text-sm leading-relaxed text-charcoal">
              <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-sky" />
              <p>
                Платёжный шлюз будет подключён на следующем этапе. Сейчас страница показывает сумму
                и статус ссылки — после интеграции здесь появится форма оплаты, а подтверждение
                будет приходить автоматически по webhook.
              </p>
            </div>
            <button
              type="button"
              disabled
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand/40 px-4 py-3 text-sm font-semibold text-white"
            >
              <Lock className="h-4 w-4" />
              Оплатить (скоро)
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate">
          Заказчик: {booking.contactName} · {booking.contactEmail}
        </p>
      </div>
    </div>
  );
}
