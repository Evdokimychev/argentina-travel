"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, CreditCard } from "lucide-react";
import CheckoutCurrencySelector from "@/components/booking/CheckoutCurrencySelector";
import CheckoutPriceDisplay from "@/components/booking/CheckoutPriceDisplay";
import BookingCheckoutShell from "@/components/booking/BookingCheckoutShell";
import BookingPaymentErrorRecovery from "@/components/booking/BookingPaymentErrorRecovery";
import { formatBookingDisplayNumber } from "@/lib/booking-display";
import {
  formatBookingPaymentLinkStatus,
  isBookingPaymentLinkExpired,
} from "@/lib/booking-payment-link";
import {
  apiCreateBookingPaymentPreference,
  apiCreateBookingStripeSession,
  isRemoteBookingsMode,
} from "@/lib/bookings-api";
import {
  PAYMENT_GATEWAY_LABELS,
  resolveClientPaymentProviders,
  resolveDefaultPaymentProvider,
  type OnlinePaymentGateway,
} from "@/lib/payments/payment-providers-client";
import {
  getBookingByPaymentLinkToken,
  markBookingPaymentLinkOpened,
} from "@/lib/bookings-store";
import type { Booking } from "@/types/tourist";
import { BOOKINGS_UPDATED_EVENT } from "@/types/tourist";
import { Button } from "@/components/ui/button";
import { normalizeSiteError, siteFormError } from "@/lib/site-feedback/normalize-error";
import type { SiteFeedbackMessage } from "@/types/site-feedback";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { useCheckoutCurrencyRates } from "@/hooks/useCheckoutCurrencyRates";
import {
  resolveDefaultCheckoutCurrency,
  type CheckoutCurrencyCode,
} from "@/lib/payments/checkout-currency";

export default function BookingPaymentLinkView({ token }: { token: string }) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [checkoutError, setCheckoutErrorState] = useState<SiteFeedbackMessage | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<OnlinePaymentGateway | null>(null);
  const remoteMode = isRemoteBookingsMode();
  const availableProviders = resolveClientPaymentProviders();
  const defaultProvider = resolveDefaultPaymentProvider();
  const { currency: localeCurrency } = useLocaleCurrency();
  const { rates: checkoutRates } = useCheckoutCurrencyRates();
  const [checkoutCurrency, setCheckoutCurrency] = useState<CheckoutCurrencyCode>(() =>
    resolveDefaultCheckoutCurrency(localeCurrency)
  );

  const setCheckoutError = (value: string | SiteFeedbackMessage | null) => {
    if (value === null) {
      setCheckoutErrorState(null);
      return;
    }
    setCheckoutErrorState(typeof value === "string" ? siteFormError(value) : value);
  };

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

  useEffect(() => {
    if (booking?.metadata?.checkoutCurrency) {
      setCheckoutCurrency(booking.metadata.checkoutCurrency);
    } else {
      setCheckoutCurrency(resolveDefaultCheckoutCurrency(localeCurrency));
    }
  }, [booking?.id, booking?.metadata?.checkoutCurrency, localeCurrency]);

  useEffect(() => {
    if (selectedGateway) return;
    if (booking?.paymentLink?.gateway === "mercadopago" || booking?.paymentLink?.gateway === "stripe") {
      setSelectedGateway(booking.paymentLink.gateway);
      return;
    }
    if (defaultProvider) {
      setSelectedGateway(defaultProvider);
    }
  }, [booking?.paymentLink?.gateway, defaultProvider, selectedGateway]);

  useEffect(() => {
    if (!booking?.paymentLink?.checkoutUrl) return;
    if (booking.paymentLink.status !== "active") return;
    if (isBookingPaymentLinkExpired(booking.paymentLink)) return;
    if (redirecting) return;
    setRedirecting(true);
    window.location.assign(booking.paymentLink.checkoutUrl);
  }, [booking, redirecting]);

  if (!booking?.paymentLink) {
    return (
      <BookingCheckoutShell
        currentStep="payment"
        eyebrow="Оплата бронирования"
        title="Ссылка не найдена"
        description="Ссылка на оплату недействительна или заявка была удалена. Проверьте письмо от организатора или найдите заявку по email."
      >
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/booking/find"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-charcoal transition-colors hover:bg-gray-50"
          >
            Найти заявку по email
          </Link>
          <Link
            href="/contacts"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-charcoal transition-colors hover:bg-gray-50"
          >
            Поддержка
          </Link>
        </div>
      </BookingCheckoutShell>
    );
  }

  const link = booking.paymentLink;
  const displayNumber = formatBookingDisplayNumber(booking.id);
  const expired = isBookingPaymentLinkExpired(link);
  const paid = link.status === "paid";
  const paymentProvider =
    selectedGateway === "stripe" ? "stripe" : selectedGateway === "mercadopago" ? "mercadopago" : undefined;

  async function handleCheckout() {
    if (!booking?.paymentLink) return;
    const gateway = selectedGateway ?? defaultProvider;
    if (!gateway) {
      setCheckoutError(
        "Онлайн-оплата недоступна: не настроены платёжные провайдеры. Обратитесь в поддержку."
      );
      return;
    }

    if (booking.paymentLink.gateway === gateway && booking.paymentLink.checkoutUrl) {
      setRedirecting(true);
      window.location.assign(booking.paymentLink.checkoutUrl);
      return;
    }

    if (!remoteMode) {
      setCheckoutError(
        "Онлайн-оплата доступна после подключения серверного режима бронирований и ключей платёжных провайдеров."
      );
      return;
    }

    setCheckoutError(null);
    setCheckoutLoading(true);
    try {
      if (gateway === "stripe") {
        const result = await apiCreateBookingStripeSession({
          bookingId: booking.id,
          paymentLinkToken: token,
        });
        const checkoutUrl = result.checkoutUrl?.trim();
        if (!checkoutUrl) {
          throw new Error("Stripe не вернул checkout URL.");
        }

        setBooking((prev) =>
          prev?.paymentLink
            ? {
                ...prev,
                paymentLink: {
                  ...prev.paymentLink,
                  gateway: "stripe",
                  sessionId: result.sessionId,
                  checkoutUrl,
                },
              }
            : prev
        );
        setRedirecting(true);
        window.location.assign(checkoutUrl);
        return;
      }

      const result = await apiCreateBookingPaymentPreference({
        bookingId: booking.id,
        paymentLinkToken: token,
      });
      const checkoutUrl = result.checkoutUrl?.trim();
      if (!checkoutUrl) {
        throw new Error("Mercado Pago не вернул checkout URL.");
      }

      setBooking((prev) =>
        prev?.paymentLink
          ? {
              ...prev,
              paymentLink: {
                ...prev.paymentLink,
                gateway: "mercadopago",
                preferenceId: result.preferenceId,
                checkoutUrl,
                checkoutSandboxUrl: result.checkoutSandboxUrl ?? undefined,
              },
            }
          : prev
      );
      setRedirecting(true);
      window.location.assign(checkoutUrl);
    } catch (error) {
      const normalized = normalizeSiteError(error, {
        title: "Не удалось открыть оплату",
        steps: ["Попробуйте снова через минуту", "Если ошибка повторяется — напишите в поддержку"],
        action: { label: "Контакты", href: "/contacts" },
      });
      setCheckoutError(normalized);
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <BookingCheckoutShell
      currentStep="payment"
      eyebrow="Оплата бронирования"
      title={`Заявка №${displayNumber}`}
      description={booking.tourTitle}
    >
      <div className="mt-6 space-y-4">
        <CheckoutCurrencySelector value={checkoutCurrency} onChange={setCheckoutCurrency} />
        <div className="rounded-xl bg-gray-50 px-4 py-4">
          <p className="text-sm text-slate">К оплате</p>
          <CheckoutPriceDisplay
            amountUsd={link.amountUsd}
            currency={checkoutCurrency}
            rates={checkoutRates}
            provider={paymentProvider}
            className="mt-2"
          />
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
        <div className="mt-6">
          <BookingPaymentErrorRecovery
            title="Срок действия ссылки истёк"
            description="Свяжитесь с организатором тура для получения новой ссылки или уточните способ оплаты напрямую."
            steps={[
              "Проверьте почту — возможно, организатор уже отправил обновлённую ссылку",
              "Напишите в поддержку, если не получили ответ",
            ]}
            retryHref="/booking/find"
            retryLabel="Найти заявку"
          />
        </div>
      ) : link.status === "cancelled" ? (
        <div className="mt-6">
          <BookingPaymentErrorRecovery
            title="Ссылка отменена"
            description="Организатор отменил ссылку на оплату. Обратитесь к организатору тура для уточнения способа оплаты."
            retryHref="/contacts"
            retryLabel="Связаться с поддержкой"
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {availableProviders.length > 1 ? (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-charcoal">Способ оплаты</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {availableProviders.map((provider) => (
                  <label
                    key={provider}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                      selectedGateway === provider
                        ? "border-sky bg-sky/5 text-charcoal"
                        : "border-gray-200 bg-white text-charcoal hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-gateway"
                      value={provider}
                      checked={selectedGateway === provider}
                      onChange={() => setSelectedGateway(provider)}
                      className="h-4 w-4 accent-sky"
                    />
                    <span className="font-medium">{PAYMENT_GATEWAY_LABELS[provider]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          <div className="flex items-start gap-3 rounded-xl border border-sky-200/70 bg-sky-50/60 px-4 py-4 text-sm leading-relaxed text-charcoal">
            <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-sky" />
            <p>
              {selectedGateway === "stripe"
                ? "Оплата проходит через защищённую страницу Stripe. После нажатия вы будете перенаправлены для ввода данных карты."
                : "Оплата проходит через защищённую страницу Mercado Pago. После нажатия вы будете перенаправлены в платёжный интерфейс."}
            </p>
          </div>
          <Button
            type="button"
            className="h-12 w-full text-base"
            onClick={handleCheckout}
            loading={checkoutLoading || redirecting}
            loadingLabel={redirecting ? "Перенаправляем…" : "Готовим оплату…"}
          >
            {selectedGateway === "stripe"
              ? "Перейти к оплате через Stripe"
              : "Перейти к оплате в Mercado Pago"}
          </Button>
          {checkoutError ? (
            <BookingPaymentErrorRecovery
              title={checkoutError.title ?? "Не удалось открыть оплату"}
              description={checkoutError.description}
              steps={checkoutError.steps}
              onRetry={handleCheckout}
              retryLoading={checkoutLoading}
              retryLoadingLabel="Готовим оплату…"
            />
          ) : null}
          <Link
            href="/contacts"
            className="flex h-11 w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-charcoal transition-colors hover:bg-gray-50"
          >
            Связаться с поддержкой
          </Link>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-slate">
        Заказчик: {booking.contactName} · {booking.contactEmail}
      </p>
    </BookingCheckoutShell>
  );
}
