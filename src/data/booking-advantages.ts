import type { TourDetail } from "@/types";
import {
  getEnabledCheckoutPaymentOptions,
  resolveTourCheckoutPaymentOptionsFromTour,
} from "@/lib/tour-checkout-payment";

export const DEFAULT_BOOKING_ADVANTAGES = [
  "Заявка без предоплаты",
  "Организатор подтверждает детали лично",
  "Гибкие условия отмены",
  "Оплата после подтверждения",
] as const;

export const PAY_LATER_ONLY_BOOKING_ADVANTAGES = [
  "Заявка без предоплаты",
  "Организатор подтверждает детали лично",
  "Гибкие условия отмены",
  "Оплата после подтверждения",
] as const;

export function resolveTourBookingAdvantages(tour: TourDetail): readonly string[] {
  if (tour.bookingAdvantages?.length) {
    return tour.bookingAdvantages;
  }

  const options = resolveTourCheckoutPaymentOptionsFromTour(tour);
  const enabled = getEnabledCheckoutPaymentOptions(options);
  const ids = new Set(enabled.map((item) => item.id));

  if (ids.size === 1 && ids.has("later")) {
    return PAY_LATER_ONLY_BOOKING_ADVANTAGES;
  }

  const advantages: string[] = [];

  if (ids.has("later")) {
    advantages.push("Заявка без предоплаты", "Оплата после подтверждения");
  }
  if (ids.has("deposit")) {
    advantages.push(`Можно внести депозит ${options.depositPercent}%`);
  }
  if (ids.has("full")) {
    advantages.push("Полная оплата на сайте");
  }

  advantages.push("Организатор подтверждает детали лично", "Гибкие условия отмены");

  return advantages.length > 0 ? advantages : DEFAULT_BOOKING_ADVANTAGES;
}
