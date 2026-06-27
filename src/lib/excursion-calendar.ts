import type { ExcursionScheduleDate } from "@/lib/excursion-schedule";
import type { ExcursionTicketOption } from "@/types/excursion";
import { formatCompactUsd } from "@/lib/tour-date-pricing";

export type ExcursionCalendarDate = {
  date: string;
  priceValue?: number;
  priceText?: string;
};

const PARTICIPANT_TICKET_PATTERN =
  /^(взросл|реб[ёе]н|дет|участник|гост|человек|взрослый|adult|child|guest|participant|person)/i;

/** Minimum slot price for a schedule day (Tripster may vary price by time). */
export function resolveExcursionDatePrice(
  entry: Pick<ExcursionScheduleDate, "slots">
): Pick<ExcursionCalendarDate, "priceValue" | "priceText"> {
  const pricedSlots = entry.slots.filter(
    (slot) => slot.priceValue != null || Boolean(slot.priceText?.trim())
  );
  if (pricedSlots.length === 0) return {};

  const minSlot = pricedSlots.reduce((best, slot) => {
    const bestValue = best.priceValue ?? Number.POSITIVE_INFINITY;
    const slotValue = slot.priceValue ?? Number.POSITIVE_INFINITY;
    return slotValue < bestValue ? slot : best;
  });

  return {
    priceValue: minSlot.priceValue,
    priceText: minSlot.priceText?.trim() || undefined,
  };
}

export function buildExcursionCalendarDates(
  scheduleDates: ExcursionScheduleDate[]
): ExcursionCalendarDate[] {
  return scheduleDates.map((entry) => ({
    date: entry.date,
    ...resolveExcursionDatePrice(entry),
  }));
}

export function formatExcursionCalendarPrice(date: Pick<ExcursionCalendarDate, "priceValue" | "priceText">): string | null {
  if (date.priceText?.trim()) {
    const compact = date.priceText.trim();
    const digits = compact.replace(/[^\d]/g, "");
    if (digits.length <= 4) return compact;
    const amount = Number.parseInt(digits, 10);
    if (Number.isFinite(amount) && amount > 0) {
      return formatCompactUsd(amount);
    }
    return compact;
  }

  if (date.priceValue != null && date.priceValue > 0) {
    return formatCompactUsd(date.priceValue);
  }

  return null;
}

/** Ticket options that look like optional add-ons rather than participant types. */
export function resolveExcursionAdditionalServices(
  ticketOptions: ExcursionTicketOption[]
): ExcursionTicketOption[] {
  if (ticketOptions.length === 0) return [];

  const addOns = ticketOptions.filter(
    (option) => !option.isDefault && !PARTICIPANT_TICKET_PATTERN.test(option.title.trim())
  );
  if (addOns.length > 0) return addOns;

  const nonDefault = ticketOptions.filter((option) => !option.isDefault);
  if (nonDefault.length > 0) return nonDefault;

  return ticketOptions.length > 1 ? ticketOptions.slice(1) : [];
}

export function formatExcursionServicePrice(
  option: Pick<ExcursionTicketOption, "value">,
  currency = "USD"
): string | null {
  if (option.value == null || !Number.isFinite(option.value) || option.value <= 0) {
    return null;
  }

  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(option.value);
  } catch {
    return `$${Math.round(option.value)}`;
  }
}
