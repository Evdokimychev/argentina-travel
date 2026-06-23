import type {
  ExcursionBookingConditionItem,
  ExcursionBookingConditions,
} from "@/lib/tripster/booking-conditions";
import type { ExcursionDetail } from "@/types/excursion";

function formatMinimumBookPeriod(hoursRaw: string | undefined): string | null {
  const raw = hoursRaw?.trim();
  if (!raw) return null;

  const hours = Number.parseInt(raw, 10);
  if (!Number.isFinite(hours) || hours <= 0) return null;

  if (hours % 24 === 0) {
    const days = hours / 24;
    return days === 1 ? "за 1 сутки" : `за ${days} суток`;
  }

  return hours === 1 ? "за 1 час" : `за ${hours} часов`;
}

export function buildSputnik8BookingConditions(
  excursion: Pick<
    ExcursionDetail,
    | "payTypeInText"
    | "minimumBookPeriod"
    | "refundPolicy"
    | "instantBooking"
    | "isBookable"
    | "priceValue"
    | "priceCurrency"
    | "priceDisplay"
  >
): ExcursionBookingConditions {
  const items: ExcursionBookingConditionItem[] = [];

  if (excursion.payTypeInText?.trim()) {
    items.push({
      kind: "custom",
      text: `Оплата: ${excursion.payTypeInText.trim()}.`,
    });
  } else if (excursion.priceValue != null) {
    items.push({
      kind: "custom",
      text: "Стоимость указана на момент публикации. Точную сумму и способ оплаты уточняйте при бронировании.",
    });
  }

  const bookPeriodLabel = formatMinimumBookPeriod(excursion.minimumBookPeriod);
  if (bookPeriodLabel) {
    items.push({
      kind: "custom",
      text: `Бронирование доступно не позднее чем ${bookPeriodLabel} до начала.`,
    });
  }

  if (excursion.refundPolicy?.trim()) {
    items.push({
      kind: "custom",
      text: excursion.refundPolicy.trim(),
    });
  }

  if (excursion.instantBooking) {
    items.push({ kind: "instantBooking" });
  }

  if (excursion.isBookable !== false) {
    items.push({ kind: "askOrganizer" });
  }

  return { items };
}
