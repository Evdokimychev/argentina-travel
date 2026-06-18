import type { TripsterGuideProfile } from "@/lib/tripster/types";
import type { ExcursionGuideProfile } from "@/types/excursion";

export function buildExcursionGuideHref(guideId: number): string {
  return `/excursions/guide/${guideId}`;
}

export function buildPartnerGuideCatalogHref(guideId: number): string {
  return `/tours?${new URLSearchParams({ organizer: `tripster-guide-${guideId}` }).toString()}`;
}

export function resolveTripsterGuideRoleLabel(
  guideType: string | undefined,
  isLicensed?: boolean
): string {
  const normalized = guideType?.trim().toLowerCase() ?? "";
  if (normalized === "agency" || normalized === "team") {
    return "Представитель агентства";
  }
  if (isLicensed) return "Лицензированный гид";
  if (normalized === "guide") return "Гид";
  return "Гид";
}

export function splitGuideDescriptionParagraphs(description: string | undefined): string[] {
  if (!description?.trim()) return [];

  return description
    .split(/\r?\n\r?\n+/)
    .map((paragraph) => paragraph.replace(/\r?\n/g, " ").trim())
    .filter(Boolean);
}

function resolveGuideVisitorCount(raw: TripsterGuideProfile): number | undefined {
  const paid = raw.number_of_persons_paid;
  if (paid != null && Number.isFinite(paid) && paid > 0) return paid;

  const rated = raw.rate_count;
  if (rated != null && Number.isFinite(rated) && rated > 0) return rated;

  return undefined;
}

export function mapTripsterGuideProfile(raw: TripsterGuideProfile): ExcursionGuideProfile {
  const name = raw.first_name?.trim() || "Гид";
  const description = raw.description?.trim() || undefined;

  return {
    id: raw.id,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    url: raw.url,
    avatar: raw.avatar?.medium || raw.avatar?.small || raw.avatar?.original,
    rating: raw.rating,
    reviewCount: raw.review_count,
    cityName: raw.city?.name_ru?.trim() || raw.city?.name_en?.trim(),
    countryName: raw.city?.country?.name_ru?.trim() || raw.city?.country?.name_en?.trim(),
    isLicensed: raw.is_licensed_guide ?? undefined,
    guideType: raw.guide_type?.trim() || undefined,
    roleLabel: resolveTripsterGuideRoleLabel(raw.guide_type, raw.is_licensed_guide),
    guideSince: raw.is_guide_since ?? undefined,
    responseTimeLabel: raw.avg_reaction_delay_display?.nominative,
    visitorCount: resolveGuideVisitorCount(raw),
    tagline: raw.determination?.trim() || undefined,
    description,
    descriptionParagraphs: splitGuideDescriptionParagraphs(description),
  };
}

export function mergeGuideProfileWithListings(
  profile: ExcursionGuideProfile,
  excursionCount: number
): ExcursionGuideProfile {
  return {
    ...profile,
    excursionCount,
  };
}
