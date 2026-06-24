import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";
import {
  formatPartnerLanguagesList,
  isPartnerAgeRangeSummary,
  resolvePartnerAgeChipMeta,
} from "@/lib/tripster/partner-tour-labels";
import { formatDays, formatSpots, peopleWord } from "@/lib/pluralize";
import {
  resolveTravelersGoingFromOffer,
} from "@/lib/youtravel/partner-offer-occupancy";
import { expandYouTravelTagLabels } from "@/lib/youtravel/partner-tour-tags";
import type { YouTravelOffer, YouTravelTour } from "@/lib/youtravel/types";
import type { TourDatePrice, TourDetail } from "@/types";

function parseBooleanFlag(value: unknown): boolean {
  if (value === true || value === 1 || value === "1" || value === "true" || value === "yes") {
    return true;
  }
  return false;
}

function resolveSerpRecord(payload: YouTravelTour): Record<string, unknown> | null {
  const serp = payload.serp;
  return serp && typeof serp === "object" ? (serp as Record<string, unknown>) : null;
}

export function resolveYouTravelInstantBooking(payload: YouTravelTour): boolean {
  const record = payload as Record<string, unknown>;
  const serp = resolveSerpRecord(payload);
  const candidates = [
    record.instant_booking,
    record.instantBooking,
    record.is_instant,
    record.isInstant,
    serp?.instant_booking,
    serp?.instantBooking,
    serp?.is_instant,
  ];
  return candidates.some(parseBooleanFlag);
}

export function resolveYouTravelTourGuaranteed(payload: YouTravelTour): boolean {
  const record = payload as Record<string, unknown>;
  const serp = resolveSerpRecord(payload);
  const candidates = [
    record.guarantee,
    record.is_guarantee,
    record.isGuarantee,
    record.tour_guaranteed,
    record.tourGuaranteed,
    serp?.guarantee,
    serp?.is_guarantee,
    serp?.tour_guaranteed,
  ];
  return candidates.some(parseBooleanFlag);
}

function parsePositiveInt(value: unknown): number | undefined {
  if (value == null) return undefined;
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export { resolveTravelersGoingFromOffer } from "@/lib/youtravel/partner-offer-occupancy";

/** «Кто уже едет» — из payload партнёра или ближайшего заезда. */
export function resolveYouTravelTravelersGoing(
  payload: YouTravelTour,
  offers?: YouTravelOffer[],
): number | undefined {
  const payloadCandidates = [
    payload.travelers_going,
    payload.travelersGoing,
    payload.count_travelers,
    payload.booked_travelers,
    payload.participants_count,
    payload.participantsCount,
    payload.booked_count,
    payload.visitors_count,
  ];

  for (const candidate of payloadCandidates) {
    const parsed = parsePositiveInt(candidate);
    if (parsed != null) return parsed;
  }

  if (!offers?.length) return undefined;

  for (const offer of offers) {
    const fromOffer = resolveTravelersGoingFromOffer(offer);
    if (fromOffer != null) return fromOffer;
  }

  return undefined;
}

/** Оценка по свободным местам выбранного заезда, если API не отдал число участников. */
export function estimateTravelersGoingFromDate(
  tour: Pick<TourDetail, "groupMax">,
  date?: TourDatePrice,
): number | undefined {
  if (!date || tour.groupMax <= 0) return undefined;
  if (date.spotsLeft >= tour.groupMax) return undefined;
  return tour.groupMax - date.spotsLeft;
}

/** Предстоящие заезды по возрастанию даты старта. */
export function listYouTravelUpcomingDepartureDates(dates: TourDatePrice[]): TourDatePrice[] {
  const today = new Date().toISOString().slice(0, 10);
  return [...dates]
    .filter((date) => date.startDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/** Ближайший предстоящий заезд или явно выбранный в блоке бронирования. */
export function resolveYouTravelReferenceDate(
  dates: TourDatePrice[],
  selectedDateId?: string,
): TourDatePrice | undefined {
  if (!dates.length) return undefined;
  if (selectedDateId) {
    const selected = dates.find((date) => date.id === selectedDateId);
    if (selected) return selected;
  }
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = [...dates]
    .filter((date) => date.startDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  return upcoming[0] ?? dates[0];
}

/** Число записавшихся на конкретный заезд (оффер или оценка по местам). */
export function resolveYouTravelTravelersGoingForDate(
  tour: Pick<TourDetail, "groupMax">,
  date?: TourDatePrice,
): number | undefined {
  if (date?.travelersGoingCount != null) return date.travelersGoingCount;
  return estimateTravelersGoingFromDate(tour, date);
}

export type YouTravelDepartureCapacity = {
  total: number;
  booked: number;
  free: number;
};

/** Вместимость заезда: всего мест, занято и свободно. */
export function resolveYouTravelDepartureCapacity(
  tour: Pick<TourDetail, "groupMax">,
  date?: TourDatePrice,
): YouTravelDepartureCapacity | null {
  if (!date) return null;

  const total =
    (date.seatsTotal != null && date.seatsTotal > 0 ? date.seatsTotal : undefined) ??
    (tour.groupMax > 0 ? tour.groupMax : undefined);

  const bookedExplicit = resolveYouTravelTravelersGoingForDate(tour, date);
  const freeFromOffer = date.spotsLeft >= 0 ? date.spotsLeft : undefined;

  if (total != null && total > 0) {
    const booked =
      bookedExplicit ??
      (freeFromOffer != null && freeFromOffer <= total ? total - freeFromOffer : undefined);
    if (booked == null || booked < 0) return null;

    const clampedBooked = Math.min(Math.max(0, booked), total);
    const free =
      freeFromOffer != null && freeFromOffer <= total
        ? freeFromOffer
        : Math.max(0, total - clampedBooked);

    return { total, booked: clampedBooked, free };
  }

  if (bookedExplicit != null && freeFromOffer != null && freeFromOffer >= 0) {
    return {
      total: bookedExplicit + freeFromOffer,
      booked: bookedExplicit,
      free: freeFromOffer,
    };
  }

  return null;
}

export function formatYouTravelDepartureOccupancySummary(
  capacity: YouTravelDepartureCapacity,
): string {
  return `${capacity.booked.toLocaleString("ru-RU")} ${peopleWord(capacity.booked)} из ${capacity.total.toLocaleString("ru-RU")} · ${formatSpots(capacity.free)} свободно`;
}

export type YouTravelTourDetailItem = {
  id: string;
  label: string;
  value: string;
};

export function buildYouTravelTourDetailItems(input: {
  tour: Pick<TourDetail, "durationDays">;
  content: PartnerTourContent;
}): YouTravelTourDetailItem[] {
  const { tour, content } = input;
  const items: YouTravelTourDetailItem[] = [];

  if (tour.durationDays > 0) {
    items.push({
      id: "duration",
      label: "Дней",
      value: formatDays(tour.durationDays),
    });
  }

  const languages = formatPartnerLanguagesList(content.languages);
  if (languages) {
    items.push({
      id: "languages",
      label: "Язык тура",
      value: languages,
    });
  }

  const ageChip = resolvePartnerAgeChipMeta(content);
  const ageValue = ageChip.value?.trim();
  if (ageValue && (ageChip.kind === "age" || isPartnerAgeRangeSummary(ageValue))) {
    items.push({
      id: "age",
      label: "Возраст группы",
      value: ageValue.replace(/\s*лет\s*$/u, "").trim() || ageValue,
    });
  }

  return items;
}

/** Типы тура для детальной страницы: основной первым, остальные отдельными бейджами. */
export function resolveYouTravelTourTypeTags(
  tour: Pick<TourDetail, "partnerThematicTags">,
  content: Pick<PartnerTourContent, "format">,
): string[] {
  const formatTags = content.format?.trim() ? expandYouTravelTagLabels(content.format) : [];
  const listingTags = tour.partnerThematicTags ?? [];
  const seen = new Set<string>();
  const result: string[] = [];

  function push(tag: string | undefined) {
    const trimmed = tag?.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(trimmed);
  }

  push(listingTags[0] ?? formatTags[0]);
  for (const tag of formatTags) push(tag);
  for (const tag of listingTags.slice(1)) push(tag);

  return result;
}

export function formatYouTravelTravelersGoingLabel(count: number): string {
  return `${count.toLocaleString("ru-RU")} ${peopleWord(count)}`;
}
