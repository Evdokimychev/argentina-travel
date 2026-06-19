import { formatCurrencyAmount } from "@/lib/currency";
import { resolveRateFromUsd, type ExchangeRatesPayload } from "@/lib/exchange-rates";
import type { CurrencyCode, LocaleCode } from "@/types/locale";
import type { PaymentProviderId } from "@/types/payment-webhook";

/** Валюты, доступные туристу при оформлении и оплате. */
export type CheckoutCurrencyCode = "USD" | "ARS" | "EUR";

export const CHECKOUT_CURRENCY_OPTIONS: ReadonlyArray<{
  code: CheckoutCurrencyCode;
  label: string;
}> = [
  { code: "USD", label: "USD" },
  { code: "ARS", label: "ARS" },
  { code: "EUR", label: "EUR" },
];

export const CHECKOUT_RATE_DISCLAIMER_RU =
  "Сумма списания может отличаться из‑за курса банка";

export interface BookingCheckoutDisplaySnapshot {
  currency: CheckoutCurrencyCode;
  totalUsd: number;
  totalDisplay: number;
  payNowUsd?: number;
  payNowDisplay?: number;
  rateFromUsd: number;
  ratesUpdatedAt?: string;
  ratesSource?: ExchangeRatesPayload["source"];
}

export interface BookingMetadata {
  checkoutCurrency?: CheckoutCurrencyCode;
  checkoutDisplay?: BookingCheckoutDisplaySnapshot;
}

export function isCheckoutCurrencyCode(value: string): value is CheckoutCurrencyCode {
  return value === "USD" || value === "ARS" || value === "EUR";
}

export function resolveDefaultCheckoutCurrency(
  localeCurrency: CurrencyCode
): CheckoutCurrencyCode {
  return isCheckoutCurrencyCode(localeCurrency) ? localeCurrency : "USD";
}

/** Валюта фактического списания у провайдера. */
export function resolveChargeCurrency(
  provider: PaymentProviderId,
  displayCurrency: CheckoutCurrencyCode
): CurrencyCode {
  if (provider === "mercadopago") return "ARS";
  if (provider === "stripe") {
    return displayCurrency === "EUR" ? "EUR" : "USD";
  }
  return displayCurrency;
}

export function convertUsdToDisplayCurrency(
  amountUsd: number,
  currency: CheckoutCurrencyCode | CurrencyCode,
  rates?: Partial<Record<CurrencyCode, number>>
): number {
  const rate = resolveRateFromUsd(currency, rates);
  return Math.round(amountUsd * rate);
}

export function formatCheckoutAmount(
  amountUsd: number,
  currency: CheckoutCurrencyCode,
  locale: LocaleCode,
  rates?: Partial<Record<CurrencyCode, number>>
): string {
  const converted = convertUsdToDisplayCurrency(amountUsd, currency, rates);
  return formatCurrencyAmount(converted, currency, locale);
}

export function buildCheckoutDisplaySnapshot(input: {
  currency: CheckoutCurrencyCode;
  totalUsd: number;
  payNowUsd?: number;
  rates?: Partial<Record<CurrencyCode, number>>;
  ratesUpdatedAt?: string;
  ratesSource?: ExchangeRatesPayload["source"];
}): BookingCheckoutDisplaySnapshot {
  const rateFromUsd = resolveRateFromUsd(input.currency, input.rates);
  const totalDisplay = Math.round(input.totalUsd * rateFromUsd);
  const payNowUsd = input.payNowUsd;
  const payNowDisplay =
    payNowUsd !== undefined ? Math.round(payNowUsd * rateFromUsd) : undefined;

  return {
    currency: input.currency,
    totalUsd: input.totalUsd,
    totalDisplay,
    payNowUsd,
    payNowDisplay,
    rateFromUsd,
    ratesUpdatedAt: input.ratesUpdatedAt,
    ratesSource: input.ratesSource,
  };
}

export function formatStoredCheckoutDisplayAmount(
  snapshot: BookingCheckoutDisplaySnapshot,
  locale: LocaleCode = "ru"
): string {
  return formatCurrencyAmount(snapshot.totalDisplay, snapshot.currency, locale);
}

export function formatStoredCheckoutPayNowAmount(
  snapshot: BookingCheckoutDisplaySnapshot,
  locale: LocaleCode = "ru"
): string | null {
  if (snapshot.payNowDisplay === undefined) return null;
  return formatCurrencyAmount(snapshot.payNowDisplay, snapshot.currency, locale);
}

export function formatUsdLedgerAmount(amountUsd: number, locale: LocaleCode = "ru"): string {
  return formatCurrencyAmount(Math.round(amountUsd), "USD", locale);
}

export function formatChargeCurrencyLabel(
  provider: PaymentProviderId,
  displayCurrency: CheckoutCurrencyCode
): string {
  const charge = resolveChargeCurrency(provider, displayCurrency);
  if (charge === displayCurrency) {
    return `Списание в ${charge}`;
  }
  return `Отображение в ${displayCurrency}, списание в ${charge}`;
}
