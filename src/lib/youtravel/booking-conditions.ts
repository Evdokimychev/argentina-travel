import { htmlToPlainText } from "@/lib/rich-text";
import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";
import { formatYouTravelPrepaymentAdvantage } from "@/lib/youtravel/prepayment";
import type { TourDatePrice, TourDetail } from "@/types";

export type YouTravelBookingConditionKind =
  | "prepayment"
  | "instantBooking"
  | "guarantee"
  | "cancellation";

export type YouTravelBookingConditionItem = {
  kind: YouTravelBookingConditionKind;
  text: string;
};

export function resolveYouTravelCancellationSummary(
  content: PartnerTourContent,
): string | null {
  const item = content.importantToKnowItems?.find(
    (entry) => entry.title.trim().toLowerCase() === "условия отмены",
  );
  if (!item?.html.trim()) return null;

  const plain = htmlToPlainText(item.html)
    .split(/\n+/)
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);

  if (plain.length >= 2) {
    return `${plain[0]}; ${plain[1]}`;
  }

  const single = plain[0]?.trim();
  return single || null;
}

export function buildYouTravelBookingConditions(options: {
  tour: TourDetail;
  content: PartnerTourContent;
  selectedDate?: TourDatePrice;
  guests: number;
  totalPriceUsd: number;
}): YouTravelBookingConditionItem[] {
  const items: YouTravelBookingConditionItem[] = [];

  const prepayment = formatYouTravelPrepaymentAdvantage({
    tour: options.tour,
    selectedDate: options.selectedDate,
    guests: options.guests,
    totalPriceUsd: options.totalPriceUsd,
  });
  if (prepayment) {
    items.push({ kind: "prepayment", text: prepayment });
  }

  if (options.content.tourGuaranteed) {
    items.push({
      kind: "guarantee",
      text: "Тур гарантирован — состоится в любом случае",
    });
  }

  if (options.content.instantBooking) {
    items.push({
      kind: "instantBooking",
      text: "Моментальное бронирование — без ожидания подтверждения эксперта",
    });
  }

  const cancellation = resolveYouTravelCancellationSummary(options.content);
  if (cancellation) {
    items.push({ kind: "cancellation", text: cancellation });
  }

  return items;
}
