import type { TripsterGuideProfile } from "@/lib/tripster/types";
import type { ExcursionGuideProfile } from "@/types/excursion";

export function buildExcursionGuideHref(guideId: number): string {
  return `/excursions/guide/${guideId}`;
}

export function mapTripsterGuideProfile(raw: TripsterGuideProfile): ExcursionGuideProfile {
  const name = raw.first_name?.trim() || "Гид";
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
    guideSince: raw.is_guide_since ?? undefined,
    responseTimeLabel: raw.avg_reaction_delay_display?.nominative,
    description: raw.description?.trim() || undefined,
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
