import { splitGuideDescriptionParagraphs } from "@/lib/tripster/guide-mapper";
import { resolveYouTravelMediaUrl } from "@/lib/youtravel/partner-tour-content";
import type { YouTravelExpert, YouTravelTour } from "@/lib/youtravel/types";
import type { ExcursionGuideProfile } from "@/types/excursion";

const YOUTRAVEL_SITE_ORIGIN = "https://youtravel.me";

function parseNumericField(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", ".").trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function parseIntField(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string") {
    const parsed = Number.parseInt(value.trim(), 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function resolveExpertId(expert: YouTravelExpert | null | undefined): number | null {
  const parsed = parseIntField(expert?.id);
  return parsed != null && parsed > 0 ? parsed : null;
}

export function resolveYouTravelExpert(payload: YouTravelTour): YouTravelExpert | null {
  const expert = payload.expert;
  const expertData = payload.expert_data;
  const fallback = payload.organizer ?? payload.travelExpert ?? null;

  if (!expert && !expertData && !fallback) return null;

  return {
    ...fallback,
    ...expertData,
    ...expert,
    id: expert?.id ?? expertData?.id ?? fallback?.id,
    link: expert?.link ?? expertData?.link ?? fallback?.link,
    name:
      expertData?.name?.trim() ||
      expert?.name?.trim() ||
      expert?.fullName?.trim() ||
      fallback?.name?.trim() ||
      fallback?.fullName?.trim(),
  };
}

export function resolveYouTravelExpertRating(expert: YouTravelExpert | null | undefined): number {
  return (
    parseNumericField(expert?.rating_expert) ??
    parseNumericField(expert?.rating) ??
    0
  );
}

export function resolveYouTravelExpertReviewCount(
  expert: YouTravelExpert | null | undefined
): number {
  return (
    parseIntField(expert?.count_reviews) ??
    parseIntField(expert?.reviewCount) ??
    0
  );
}

export function resolveYouTravelExpertTourCount(
  expert: YouTravelExpert | null | undefined
): number {
  return parseIntField(expert?.tours_count) ?? 0;
}

export function buildYouTravelExpertProfileUrl(link: string | undefined): string | undefined {
  const trimmed = link?.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return `${YOUTRAVEL_SITE_ORIGIN}${trimmed}`;
  return `${YOUTRAVEL_SITE_ORIGIN}/${trimmed.replace(/^\//, "")}`;
}

export function buildYouTravelExpertCatalogHref(expertId: number): string {
  return `/tours?${new URLSearchParams({ organizer: `youtravel-expert-${expertId}` }).toString()}`;
}

/** Alias for catalog URLs — same as {@link buildYouTravelExpertCatalogHref}. */
export const buildYouTravelExpertCatalogUrl = buildYouTravelExpertCatalogHref;

export function parseYouTravelExpertOrganizerSlug(slug: string): number | null {
  const match = slug.trim().match(/^youtravel-expert-(\d+)$/i);
  if (!match) return null;
  const id = Number.parseInt(match[1], 10);
  return Number.isFinite(id) ? id : null;
}

export function resolveYouTravelExpertOrganizerLabel(
  slug: string,
  tours: Array<{ organizerOwnerId?: string; organizer: { slug?: string; name: string } }> = []
): string | null {
  if (parseYouTravelExpertOrganizerSlug(slug) == null) return null;
  const normalized = slug.trim();
  const sample = tours.find(
    (tour) =>
      tour.organizerOwnerId === normalized ||
      (tour.organizer.slug != null && tour.organizer.slug === normalized)
  );
  return sample?.organizer.name ?? "Эксперт YouTravel.me";
}

export function mapYouTravelExpertToGuideProfile(
  expert: YouTravelExpert
): ExcursionGuideProfile | null {
  const id = resolveExpertId(expert);
  if (id == null) return null;

  const name = expert.name?.trim() || expert.fullName?.trim() || "Тревел-эксперт";
  const description = expert.personal_notes?.trim() || undefined;
  const guideSince = expert.guide_since?.trim() || expert.registered_at?.trim() || undefined;

  return {
    id,
    name,
    url: buildYouTravelExpertProfileUrl(expert.link),
    avatar:
      resolveYouTravelMediaUrl(expert.avatar) ??
      resolveYouTravelMediaUrl(expert.photo) ??
      undefined,
    rating: resolveYouTravelExpertRating(expert) || undefined,
    reviewCount: resolveYouTravelExpertReviewCount(expert) || undefined,
    excursionCount: resolveYouTravelExpertTourCount(expert) || undefined,
    roleLabel: "Тревел-эксперт YouTravel.me",
    guideSince,
    description,
    descriptionParagraphs: splitGuideDescriptionParagraphs(description),
  };
}
