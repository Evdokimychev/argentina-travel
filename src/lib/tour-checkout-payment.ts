import { BOOKING_CHECKOUT_PAYMENT_LABELS } from "@/types/booking-params";
import type { BookingCheckoutPaymentOption } from "@/types/booking-params";
import type { TourCheckoutPaymentOptions } from "@/types/tour-checkout-payment";
import {
  DEFAULT_TOUR_CHECKOUT_PAYMENT_OPTIONS,
  isTourCheckoutPaymentOptionEnabled,
  normalizeTourCheckoutPaymentOptions,
  pickDefaultTourCheckoutPaymentOption,
} from "@/types/tour-checkout-payment";
import type { TourDetail } from "@/types";
import type { Tour } from "@/types/tour";

/** Card payments disabled until a real gateway is integrated (Phase 1). */
export const CHECKOUT_CARD_PAYMENTS_ENABLED = false;

export function resolveTourCheckoutPaymentOptions(
  source?: Partial<TourCheckoutPaymentOptions> | null
): TourCheckoutPaymentOptions {
  return normalizeTourCheckoutPaymentOptions(source ?? DEFAULT_TOUR_CHECKOUT_PAYMENT_OPTIONS);
}

export function resolveTourCheckoutPaymentOptionsFromTour(
  tour: Pick<Tour, "booking"> | Pick<TourDetail, "checkoutPaymentOptions">
): TourCheckoutPaymentOptions {
  if ("checkoutPaymentOptions" in tour && tour.checkoutPaymentOptions) {
    return resolveTourCheckoutPaymentOptions(tour.checkoutPaymentOptions);
  }

  if ("booking" in tour) {
    return resolveTourCheckoutPaymentOptions(tour.booking.checkoutPaymentOptions);
  }

  return DEFAULT_TOUR_CHECKOUT_PAYMENT_OPTIONS;
}

export function getEnabledCheckoutPaymentOptions(
  options: TourCheckoutPaymentOptions
): Array<{ id: BookingCheckoutPaymentOption; label: string }> {
  const items: Array<{ id: BookingCheckoutPaymentOption; label: string }> = [];

  if (CHECKOUT_CARD_PAYMENTS_ENABLED && options.fullPaymentEnabled) {
    items.push({ id: "full", label: BOOKING_CHECKOUT_PAYMENT_LABELS.full });
  }

  if (CHECKOUT_CARD_PAYMENTS_ENABLED && options.depositEnabled) {
    items.push({
      id: "deposit",
      label: `Депозит ${options.depositPercent}%`,
    });
  }

  if (options.payLaterEnabled) {
    items.push({ id: "later", label: BOOKING_CHECKOUT_PAYMENT_LABELS.later });
  }

  if (items.length === 0) {
    items.push({ id: "later", label: BOOKING_CHECKOUT_PAYMENT_LABELS.later });
  }

  return items;
}

export function resolveCheckoutDepositAmountUsd(
  totalUsd: number,
  options: TourCheckoutPaymentOptions
): number {
  return Math.round((totalUsd * options.depositPercent) / 100);
}

export function ensureValidCheckoutPaymentOption(
  option: BookingCheckoutPaymentOption,
  options: TourCheckoutPaymentOptions
): BookingCheckoutPaymentOption {
  if (isTourCheckoutPaymentOptionEnabled(options, option)) return option;
  return pickDefaultTourCheckoutPaymentOption(options);
}
