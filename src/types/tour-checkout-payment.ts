import type { BookingCheckoutPaymentOption } from "@/types/booking-params";

export interface TourCheckoutPaymentOptions {
  fullPaymentEnabled: boolean;
  depositEnabled: boolean;
  payLaterEnabled: boolean;
  /** Deposit share shown at checkout, percent of total. */
  depositPercent: number;
}

export const DEFAULT_TOUR_CHECKOUT_PAYMENT_OPTIONS: TourCheckoutPaymentOptions = {
  fullPaymentEnabled: false,
  depositEnabled: false,
  payLaterEnabled: true,
  depositPercent: 10,
};

export function normalizeTourCheckoutPaymentOptions(
  raw?: Partial<TourCheckoutPaymentOptions> | null
): TourCheckoutPaymentOptions {
  const merged = {
    ...DEFAULT_TOUR_CHECKOUT_PAYMENT_OPTIONS,
    ...raw,
  };

  const depositPercent = Math.min(100, Math.max(1, Math.round(merged.depositPercent || 10)));

  const fullPaymentEnabled = merged.fullPaymentEnabled !== false;
  const depositEnabled = merged.depositEnabled !== false;
  let payLaterEnabled = merged.payLaterEnabled !== false;

  if (!fullPaymentEnabled && !depositEnabled && !payLaterEnabled) {
    payLaterEnabled = true;
  }

  return {
    fullPaymentEnabled,
    depositEnabled,
    payLaterEnabled,
    depositPercent,
  };
}

export function countEnabledTourCheckoutPaymentOptions(
  options: TourCheckoutPaymentOptions
): number {
  return [
    options.fullPaymentEnabled,
    options.depositEnabled,
    options.payLaterEnabled,
  ].filter(Boolean).length;
}

export function isTourCheckoutPaymentOptionEnabled(
  options: TourCheckoutPaymentOptions,
  option: BookingCheckoutPaymentOption
): boolean {
  if (option === "full") return options.fullPaymentEnabled;
  if (option === "deposit") return options.depositEnabled;
  return options.payLaterEnabled;
}

export function pickDefaultTourCheckoutPaymentOption(
  options: TourCheckoutPaymentOptions
): BookingCheckoutPaymentOption {
  if (options.payLaterEnabled) return "later";
  if (options.fullPaymentEnabled) return "full";
  if (options.depositEnabled) return "deposit";
  return "later";
}

export function toggleTourCheckoutPaymentOption(
  options: TourCheckoutPaymentOptions,
  option: BookingCheckoutPaymentOption,
  enabled: boolean
): TourCheckoutPaymentOptions | { error: string } {
  const next = { ...options };

  if (option === "full") next.fullPaymentEnabled = enabled;
  if (option === "deposit") next.depositEnabled = enabled;
  if (option === "later") next.payLaterEnabled = enabled;

  const normalized = normalizeTourCheckoutPaymentOptions(next);
  const enabledCount = countEnabledTourCheckoutPaymentOptions(normalized);

  if (enabledCount === 0) {
    return { error: "Должен быть включён хотя бы один способ оплаты" };
  }

  if (!enabled && countEnabledTourCheckoutPaymentOptions(options) === 1) {
    return { error: "Нельзя отключить последний способ оплаты" };
  }

  return normalized;
}
