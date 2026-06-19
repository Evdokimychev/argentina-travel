"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, Clock, Loader2, XCircle } from "lucide-react";
import FormattedPrice from "@/components/FormattedPrice";
import BookingCheckoutShell from "@/components/booking/BookingCheckoutShell";
import BookingPaymentErrorRecovery from "@/components/booking/BookingPaymentErrorRecovery";
import BookingPaymentReceiptSection from "@/components/booking/BookingPaymentReceiptSection";
import BookingPaymentSuccessCelebration from "@/components/booking/BookingPaymentSuccessCelebration";
import { buildBookingPaymentLinkPath } from "@/lib/booking-payment-link";
import {
  apiFetchPaymentLinkStatus,
  isRemoteBookingsMode,
  type PaymentLinkStatusResponse,
} from "@/lib/bookings-api";
import {
  getBookingByPaymentLinkToken,
  markBookingPaymentLinkOpened,
} from "@/lib/bookings-store";
import { resolveBookingPaymentStatus } from "@/lib/booking-params";
import type { Booking } from "@/types/tourist";
import { BOOKINGS_UPDATED_EVENT } from "@/types/tourist";

type ResultStatus = "success" | "pending" | "failure";

const POLL_INTERVAL_MS = 4000;
const POLL_MAX_ATTEMPTS = 15;

function normalizeResultStatus(value: string | null | undefined): ResultStatus {
  if (value === "success" || value === "pending" || value === "failure") return value;
  return "pending";
}

function resolveLocalStatus(booking: Booking | null): PaymentLinkStatusResponse | null {
  if (!booking?.paymentLink) return null;
  const paymentStatus = resolveBookingPaymentStatus(booking);
  return {
    bookingId: booking.id,
    tourTitle: booking.tourTitle,
    contactName: booking.contactName,
    paymentStatus,
    linkStatus: booking.paymentLink.status,
    amountUsd: booking.paymentLink.amountUsd,
    expired: false,
    paidAt: booking.paymentLink.paidAt ?? null,
    receipt: null,
  };
}

export default function BookingPaymentResultView({
  token,
  status: rawStatus,
}: {
  token: string;
  status: string;
}) {
  const status = normalizeResultStatus(rawStatus);
  const remoteMode = isRemoteBookingsMode();
  const [localBooking, setLocalBooking] = useState<Booking | null>(null);
  const [remoteStatus, setRemoteStatus] = useState<PaymentLinkStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollAttempt, setPollAttempt] = useState(0);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    if (remoteMode) {
      try {
        const payload = await apiFetchPaymentLinkStatus(token);
        setRemoteStatus(payload);
        setFetchError(null);
      } catch (error) {
        setFetchError(error instanceof Error ? error.message : "Не удалось проверить статус оплаты");
      } finally {
        setLoading(false);
      }
      return;
    }

    const found = getBookingByPaymentLinkToken(token) ?? null;
    setLocalBooking(found);
    setLoading(false);
  }, [remoteMode, token]);

  useEffect(() => {
    void refreshStatus();
    window.addEventListener(BOOKINGS_UPDATED_EVENT, refreshStatus);
    return () => window.removeEventListener(BOOKINGS_UPDATED_EVENT, refreshStatus);
  }, [refreshStatus]);

  useEffect(() => {
    const found = getBookingByPaymentLinkToken(token);
    if (found?.paymentLink?.token === token && found.paymentLink.status === "active") {
      markBookingPaymentLinkOpened(token);
    }
  }, [token]);

  const snapshot = remoteMode ? remoteStatus : resolveLocalStatus(localBooking);
  const confirmedPaid =
    snapshot?.paymentStatus === "paid" || snapshot?.paymentStatus === "partial";
  const confirmedFailed =
    status === "failure" && !confirmedPaid && snapshot?.paymentStatus === "pending";
  const awaitingConfirmation =
    (status === "success" || status === "pending") && !confirmedPaid && !confirmedFailed;

  useEffect(() => {
    if (!remoteMode || !awaitingConfirmation) return;
    if (pollAttempt >= POLL_MAX_ATTEMPTS) return;

    const timer = window.setTimeout(() => {
      setPollAttempt((value) => value + 1);
      void refreshStatus();
    }, POLL_INTERVAL_MS);

    return () => window.clearTimeout(timer);
  }, [awaitingConfirmation, pollAttempt, refreshStatus, remoteMode]);

  const title = useMemo(() => {
    if (confirmedPaid) return "Оплата подтверждена";
    if (confirmedFailed) return "Оплата не прошла";
    if (status === "failure") return "Оплата не завершена";
    if (status === "pending" || awaitingConfirmation) return "Оплата обрабатывается";
    return "Проверяем статус оплаты";
  }, [awaitingConfirmation, confirmedFailed, confirmedPaid, status]);

  const description = useMemo(() => {
    if (confirmedPaid) {
      return "Платёж зафиксирован в системе. Ниже — данные квитанции из журнала операций.";
    }
    if (confirmedFailed) {
      return "Mercado Pago сообщил об ошибке или отмене. Списание не подтверждено — повторите оплату или свяжитесь с организатором.";
    }
    if (awaitingConfirmation) {
      return "Mercado Pago принял платёж, но платформа ещё ждёт подтверждение по защищённому уведомлению. Это может занять до нескольких минут.";
    }
    return "Мы проверяем актуальный статус операции.";
  }, [awaitingConfirmation, confirmedFailed, confirmedPaid]);

  if (loading && !snapshot) {
    return (
      <BookingCheckoutShell
        currentStep="result"
        eyebrow="Результат оплаты"
        title="Проверяем статус"
        showProgress={false}
      >
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate">
          <Loader2 className="h-5 w-5 animate-spin" />
          Ожидаем ответ платёжной системы…
        </div>
      </BookingCheckoutShell>
    );
  }

  if (!snapshot && fetchError) {
    return (
      <BookingCheckoutShell currentStep="result" eyebrow="Результат оплаты" title="Ошибка загрузки">
        <BookingPaymentErrorRecovery
          className="mt-2"
          title="Не удалось загрузить статус"
          description={fetchError}
          steps={["Проверьте подключение к интернету", "Обновите страницу через минуту"]}
          retryHref={buildBookingPaymentLinkPath(token)}
          retryLabel="Вернуться к оплате"
        />
      </BookingCheckoutShell>
    );
  }

  if (!snapshot) {
    return (
      <BookingCheckoutShell
        currentStep="result"
        eyebrow="Результат оплаты"
        title="Ссылка не найдена"
        description="Ссылка на оплату недействительна или заявка была удалена."
      >
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/booking/find"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-charcoal hover:bg-gray-50"
          >
            Найти заявку
          </Link>
          <Link
            href="/contacts"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-charcoal hover:bg-gray-50"
          >
            Поддержка
          </Link>
        </div>
      </BookingCheckoutShell>
    );
  }

  const toneClass = confirmedPaid
    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : confirmedFailed || status === "failure"
      ? "border-red-200 bg-red-50 text-red-900"
      : "border-amber-200 bg-amber-50 text-amber-900";

  const statusIcon = confirmedPaid ? (
    <Check className="h-6 w-6 text-emerald-700" />
  ) : confirmedFailed || status === "failure" ? (
    <XCircle className="h-6 w-6 text-red-600" />
  ) : awaitingConfirmation ? (
    <Clock className="h-6 w-6 text-amber-700" />
  ) : (
    <AlertCircle className="h-6 w-6 text-sky" />
  );

  return (
    <BookingCheckoutShell currentStep="result" eyebrow="Результат оплаты" title={title}>
      {confirmedPaid ? (
        <>
          <BookingPaymentSuccessCelebration className="mb-4" />
          <p className="text-center text-sm leading-relaxed text-slate">{description}</p>
        </>
      ) : (
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-4 ${toneClass}`}>
          <div className="mt-0.5 shrink-0">{statusIcon}</div>
          <div>
            <p className="font-medium">{title}</p>
            <p className="mt-1 text-sm leading-relaxed">{description}</p>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl bg-gray-50 px-4 py-4">
        <p className="text-sm text-slate">{snapshot.tourTitle}</p>
        <p className="mt-1 font-heading text-2xl font-bold text-charcoal">
          <FormattedPrice priceUsd={snapshot.amountUsd} />
        </p>
        <p className="mt-2 text-xs text-slate">Заказчик: {snapshot.contactName}</p>
      </div>

      {awaitingConfirmation ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate">
          <Loader2 className="h-4 w-4 animate-spin" />
          Ожидаем подтверждение от Mercado Pago…
          {pollAttempt > 0 ? (
            <span className="text-xs text-slate/80">
              (попытка {pollAttempt} из {POLL_MAX_ATTEMPTS})
            </span>
          ) : null}
        </div>
      ) : null}

      {confirmedPaid && snapshot.receipt ? (
        <div className="mt-6">
          <BookingPaymentReceiptSection receipt={snapshot.receipt} compact />
        </div>
      ) : null}

      {(confirmedFailed || status === "failure") && !snapshot.expired ? (
        <div className="mt-6">
          <BookingPaymentErrorRecovery
            title="Оплата не завершена"
            description="Платёж не был подтверждён. Деньги не списаны или будут возвращены автоматически — это зависит от банка."
            steps={[
              "Повторите оплату по ссылке ниже",
              "Если списание уже произошло, подождите несколько минут и обновите страницу",
            ]}
            retryHref={buildBookingPaymentLinkPath(token)}
          />
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {!confirmedPaid && !snapshot.expired && !confirmedFailed && status !== "failure" ? (
          <Link
            href={buildBookingPaymentLinkPath(token)}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-sky px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-dark sm:flex-none"
          >
            Вернуться к оплате
          </Link>
        ) : null}
        <Link
          href="/profile/bookings"
          className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-charcoal hover:bg-gray-50 sm:flex-none"
        >
          Личный кабинет
        </Link>
        <Link
          href="/contacts"
          className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-charcoal hover:bg-gray-50 sm:flex-none"
        >
          Поддержка
        </Link>
      </div>
    </BookingCheckoutShell>
  );
}
