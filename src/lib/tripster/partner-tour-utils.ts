import type { TripsterExperience } from "@/lib/tripster/types";
import type { TourDetail, TourListing } from "@/types";

export const TRIPSTER_PARTNER_TOUR_TYPE = "tour";

export const PARTNER_TRIPSTER_BADGE_LABEL = "Партнёр Tripster";

export const PARTNER_TRIPSTER_BADGE_HINT =
  "Бронирование и оплата проходят на Tripster. Мы получаем партнёрскую комиссию при бронировании.";

export function resolveTripsterExperienceKind(
  row: { experience_type?: string | null; payload?: unknown }
): string | null {
  const fromColumn = row.experience_type?.trim().toLowerCase();
  if (fromColumn) return fromColumn;

  const payload = row.payload as TripsterExperience | null | undefined;
  const fromPayload = payload?.type?.trim().toLowerCase();
  return fromPayload || null;
}

export function isTripsterTourExperience(
  row: { experience_type?: string | null; payload?: unknown }
): boolean {
  return resolveTripsterExperienceKind(row) === TRIPSTER_PARTNER_TOUR_TYPE;
}

export function isTripsterPartnerListing(
  tour: Pick<TourListing, "partnerSource" | "id">
): boolean {
  return tour.partnerSource === "tripster" || tour.id.startsWith("tripster-");
}

export function isPartnerTourListing(
  tour: Pick<TourListing, "partnerSource" | "id">
): boolean {
  return (
    isTripsterPartnerListing(tour) ||
    tour.partnerSource === "youtravel" ||
    tour.id.startsWith("youtravel-")
  );
}

export function isPartnerTourDetail(
  tour: Pick<TourDetail, "partnerSource" | "id">
): boolean {
  return (
    tour.partnerSource === "tripster" ||
    tour.partnerSource === "youtravel" ||
    tour.id.startsWith("tripster-") ||
    tour.id.startsWith("youtravel-")
  );
}

const PARTNER_COUNTRY_BY_ID: Record<number, string> = {
  65: "Аргентина",
  86: "Бразилия",
  227: "Парагвай",
  45: "Чили",
};

export function resolvePartnerTourCountryName(
  experience: TripsterExperience,
  countryId?: number | null
): string {
  const fromCity =
    experience.city?.country?.name_ru?.trim() ||
    experience.city?.country?.name_en?.trim();
  if (fromCity) return fromCity;

  if (countryId != null && PARTNER_COUNTRY_BY_ID[countryId]) {
    return PARTNER_COUNTRY_BY_ID[countryId];
  }

  return "Аргентина";
}

export function resolvePartnerTourCityName(
  city?: {
    name_ru?: string | null;
    name_en?: string | null;
    slug?: string;
  } | null,
  experience?: TripsterExperience
): string {
  const fromRow = city?.name_ru?.trim() || city?.name_en?.trim() || city?.slug?.trim();
  if (fromRow) return fromRow;

  const fromExperience =
    experience?.city?.name_ru?.trim() ||
    experience?.city?.name_en?.trim();
  if (fromExperience) return fromExperience;

  const fromGeo = experience?.geo?.city?.[0]?.name?.trim();
  if (fromGeo) return fromGeo;

  return "Аргентина";
}

/**
 * Merges partner batches after platform listings. Platform slugs win on collision;
 * YouTravel uses `{title}-yt{id}` slugs, Tripster uses its own slug namespace.
 */
export function mergeMarketplaceTourListings(
  platform: TourListing[],
  ...partnerBatches: TourListing[][]
): TourListing[] {
  const platformSlugs = new Set(platform.map((item) => item.slug));
  const merged = [...platform];

  for (const partner of partnerBatches) {
    for (const item of partner) {
      if (!platformSlugs.has(item.slug)) {
        merged.push(item);
      }
    }
  }

  return merged;
}

/** SQL fragment for Postgres — tours only */
export const TRIPSTER_TOUR_WHERE_SQL = `(
  lower(coalesce(experience_type, '')) = 'tour'
  OR lower(coalesce(payload->>'type', '')) = 'tour'
)`;

/** SQL fragment for Postgres — exclude tours from excursions */
export const TRIPSTER_EXCURSION_WHERE_SQL = `NOT ${TRIPSTER_TOUR_WHERE_SQL}`;

export function partnerTourListingId(tripsterId: number): string {
  return `tripster-${tripsterId}`;
}

/**
 * Tripster's public booking page (`/experience/booking/{id}/`) reads the `time`
 * query param ТОЛЬКО в формате `HH:MM`. Если передать `HH:MM:SS`, страница
 * молча игнорирует параметр и слот времени не выбирается (проверено вживую на
 * experience 92634/50900). Поэтому для URL-страницы секунды отбрасываются.
 *
 * NB: External Orders API (создание заказа, метод цены) — наоборот, требует
 * `HH:MM:SS`. Для API используется отдельная нормализация (`normalizeTimeForApi`
 * в `src/app/api/tripster/booking-request/route.ts`).
 */
export function normalizeTripsterBookingTime(time?: string | null): string | undefined {
  const trimmed = time?.trim();
  if (!trimmed) return undefined;
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return trimmed;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function parsePartnerTourListingExperienceId(listingId: string): number | null {
  const match = listingId.match(/^tripster-(\d+)$/);
  if (!match?.[1]) return null;

  const experienceId = Number.parseInt(match[1], 10);
  return Number.isFinite(experienceId) && experienceId > 0 ? experienceId : null;
}

export function buildTripsterPartnerBookingUrl(
  experienceId: number,
  options?: {
    startDate?: string | null;
    time?: string | null;
    guests?: number | null;
    fallbackUrl?: string | null;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    messageToGuide?: string | null;
  }
): string {
  const fallback = options?.fallbackUrl?.trim();
  if (!experienceId) return fallback || "https://experience.tripster.ru/";

  try {
    const url = new URL(`https://experience.tripster.ru/experience/booking/${experienceId}/`);
    if (options?.startDate) url.searchParams.set("date", options.startDate);
    const normalizedTime = normalizeTripsterBookingTime(options?.time);
    if (normalizedTime) url.searchParams.set("time", normalizedTime);
    if (options?.guests && options.guests > 0) {
      url.searchParams.set("persons_count", String(options.guests));
    }
    if (options?.name?.trim()) {
      const name = options.name.trim();
      url.searchParams.set("name", name);
      url.searchParams.set("full_name", name);
    }
    if (options?.email?.trim()) url.searchParams.set("email", options.email.trim());
    if (options?.phone?.trim()) url.searchParams.set("phone", options.phone.trim());
    if (options?.messageToGuide?.trim()) {
      url.searchParams.set("message_to_guide", options.messageToGuide.trim());
    }
    return url.toString();
  } catch {
    return fallback || `https://experience.tripster.ru/experience/${experienceId}/`;
  }
}
