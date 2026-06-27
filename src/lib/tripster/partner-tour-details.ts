import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";
import {
  formatPartnerFormatLabel,
  formatPartnerLanguageSummary,
  formatPartnerMovementLabel,
  resolvePartnerAgeChipMeta,
} from "@/lib/tripster/partner-tour-labels";
import {
  formatPartnerDepartureOccupancySummary,
  resolvePartnerDepartureCapacity,
  type PartnerDepartureCapacity,
} from "@/lib/partner-tour/departure-capacity";
import { formatDays } from "@/lib/pluralize";
import type { TourDatePrice, TourDetail } from "@/types";

export type { PartnerDepartureCapacity as TripsterDepartureCapacity };

export {
  resolvePartnerDepartureCapacity as resolveTripsterDepartureCapacity,
  formatPartnerDepartureOccupancySummary as formatTripsterDepartureOccupancySummary,
};

export function listTripsterUpcomingDepartureDates(
  dates: TourDatePrice[],
  today = new Date().toISOString().slice(0, 10),
): TourDatePrice[] {
  return [...dates]
    .filter((date) => date.startDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function resolveTripsterReferenceDate(
  dates: TourDatePrice[],
  selectedDateId?: string,
): TourDatePrice | undefined {
  const upcoming = listTripsterUpcomingDepartureDates(dates);
  if (!upcoming.length) return undefined;

  if (selectedDateId) {
    const selected = upcoming.find((date) => date.id === selectedDateId);
    if (selected) return selected;
  }

  return upcoming[0];
}

export function buildTripsterTourDetailItems(input: {
  tour: TourDetail;
  content: PartnerTourContent;
}): Array<{ id: string; label: string; value: string }> {
  const { tour, content } = input;
  const items: Array<{ id: string; label: string; value: string }> = [];

  if (tour.durationDays > 0) {
    items.push({ id: "duration", label: "Длительность", value: formatDays(tour.durationDays) });
  }

  const formatLabel = formatPartnerFormatLabel(content.format);
  if (formatLabel) {
    items.push({ id: "format", label: "Формат", value: formatLabel });
  }

  const movementLabel = formatPartnerMovementLabel(content.movementType);
  if (movementLabel) {
    items.push({ id: "movement", label: "Передвижение", value: movementLabel });
  }

  const languages = formatPartnerLanguageSummary(content.languages);
  if (languages) {
    items.push({ id: "languages", label: "Язык", value: languages });
  }

  const ageChip = resolvePartnerAgeChipMeta(content);
  items.push({ id: "age", label: ageChip.label, value: ageChip.value });

  return items;
}
