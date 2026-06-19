import type { TourDetail } from "@/types";
import type { Tour } from "@/types/tour";
import { hasVisibleGuides, resolveCancellationText } from "@/lib/tour-public-display";
import { resolveTourCheckoutPaymentOptionsFromTour } from "@/lib/tour-checkout-payment";
import { daysWord } from "@/lib/pluralize";

const GUIDE_MENTION_PATTERN = /\bгид\b/i;

export function parseFreeCancellationDays(text: string): number | null {
  const normalized = text.trim();
  if (!normalized) return null;

  const patterns = [
    /бесплатн\w*\s+отмен\w*\s+за\s+(\d+)\s*дн/i,
    /отмен\w*\s+без\s+штраф\w*\s+за\s+(\d+)\s*дн/i,
    /(?:^|;\s*)(?:0\s*%|бесплатно)\s*[—–-]\s*(?:за\s+)?(\d+)\s*дн/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const days = Number.parseInt(match[1], 10);
      if (days > 0) return days;
    }
  }

  return null;
}

function resolveFreeCancellationDays(
  tour: TourDetail,
  canonicalTour?: Tour | null
): number | null {
  for (const item of tour.faq) {
    if (!/отмен/i.test(`${item.question} ${item.answer}`)) continue;
    const days = parseFreeCancellationDays(item.answer);
    if (days) return days;
  }

  if (canonicalTour) {
    const days = parseFreeCancellationDays(resolveCancellationText(canonicalTour));
    if (days) return days;
  }

  return null;
}

function tourMentionsGuide(tour: TourDetail): boolean {
  return tour.included.some((item) => GUIDE_MENTION_PATTERN.test(item));
}

function tourHasVisibleGuides(tour: TourDetail, canonicalTour?: Tour | null): boolean {
  if (canonicalTour && hasVisibleGuides(canonicalTour)) return true;
  return tourMentionsGuide(tour);
}

export function resolveTourBookingAdvantages(
  tour: TourDetail,
  options?: { canonicalTour?: Tour | null }
): readonly string[] {
  const canonicalTour = options?.canonicalTour;
  const advantages: string[] = [];
  const paymentOptions = resolveTourCheckoutPaymentOptionsFromTour(tour);

  if (paymentOptions.payLaterEnabled) {
    advantages.push("Не требует оплаты сейчас");
  }

  const freeCancellationDays = resolveFreeCancellationDays(tour, canonicalTour);
  if (freeCancellationDays) {
    advantages.push(`Бесплатная отмена за ${freeCancellationDays} ${daysWord(freeCancellationDays)}`);
  }

  if (tourHasVisibleGuides(tour, canonicalTour)) {
    advantages.push("Профессиональный местный гид");
  }

  if (tour.bookingMode === "on_request") {
    advantages.push("Тур полностью настраивается под вас");
  }

  return advantages;
}
