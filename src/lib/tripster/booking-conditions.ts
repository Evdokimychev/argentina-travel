import { normalizeScheduleTime } from "@/lib/excursion-schedule";
import type { TripsterPriceQuote, TripsterScheduleResponse } from "@/lib/tripster/types";

export const TRIPSTER_BEST_PRICE_URL = "https://tripster.ru/about/guarantee/";

export type ExcursionBookingConditionKind =
  | "prepayment"
  | "bestPrice"
  | "cards"
  | "cancellation"
  | "instantBooking"
  | "askOrganizer";

export type ExcursionBookingConditionItem = {
  kind: ExcursionBookingConditionKind;
  prepaymentPercent?: number;
  restPercent?: number;
  cancellationHours?: number;
  linkHref?: string;
};

export type ExcursionBookingConditions = {
  items: ExcursionBookingConditionItem[];
};

export function pickFirstScheduleSlot(
  schedule: TripsterScheduleResponse
): { date: string; time: string } | null {
  const scheduleMap = schedule.schedule ?? {};
  const dates = Object.keys(scheduleMap).sort();

  for (const date of dates) {
    for (const slot of scheduleMap[date] ?? []) {
      const rawTime = slot.time_start?.trim();
      if (rawTime) {
        return { date, time: normalizeScheduleTime(rawTime) };
      }
    }
  }

  return null;
}

export function computePrepaymentPercents(
  quote: TripsterPriceQuote
): { prepaymentPercent: number; restPercent: number } | null {
  const total = quote.value;
  const prepay = quote.pre_pay;
  const toGuide = quote.payment_to_guide;

  if (total == null || total <= 0 || prepay == null || prepay < 0) {
    return null;
  }

  const prepaymentPercent = Math.round((prepay / total) * 100);
  const restPercent =
    toGuide != null && toGuide >= 0
      ? Math.round((toGuide / total) * 100)
      : Math.max(0, 100 - prepaymentPercent);

  if (prepaymentPercent <= 0 && restPercent <= 0) {
    return null;
  }

  return { prepaymentPercent, restPercent };
}

export function computeCancellationHours(closesBeforeMinutes: number | undefined): number | null {
  if (closesBeforeMinutes == null || closesBeforeMinutes <= 0) {
    return null;
  }

  return Math.max(1, Math.round(closesBeforeMinutes / 60));
}

export function buildExcursionBookingConditions(input: {
  quote: TripsterPriceQuote | null;
  closesBeforeMinutes?: number;
  instantBooking?: boolean;
  isBookable?: boolean;
}): ExcursionBookingConditions {
  const items: ExcursionBookingConditionItem[] = [];

  if (input.quote) {
    const prepayment = computePrepaymentPercents(input.quote);
    if (prepayment) {
      items.push({
        kind: "prepayment",
        prepaymentPercent: prepayment.prepaymentPercent,
        restPercent: prepayment.restPercent,
      });
    }
  }

  items.push({
    kind: "bestPrice",
    linkHref: TRIPSTER_BEST_PRICE_URL,
  });

  items.push({ kind: "cards" });

  const cancellationHours = computeCancellationHours(input.closesBeforeMinutes);
  if (cancellationHours != null) {
    items.push({
      kind: "cancellation",
      cancellationHours,
    });
  }

  if (input.instantBooking) {
    items.push({ kind: "instantBooking" });
  }

  if (input.isBookable !== false) {
    items.push({ kind: "askOrganizer" });
  }

  return { items };
}
