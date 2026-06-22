import { getOrganizerCanonicalStats } from "@/data/organizer-canonical-stats";
import { SEED_USERS } from "@/lib/auth-store";
import { joinFullName } from "@/lib/full-name";
import { getOrganizerTourOwnerId } from "@/lib/organizer-tour-store";
import { readOrganizerProfile } from "@/lib/organizer-profile-store";
import { filterArgentinaHomepageTours } from "@/lib/homepage-tours";
import {
  getAllCanonicalTours,
  getMarketplaceListings,
} from "@/lib/tour-repository";
import type { TourListing, TourOrganizerDetail } from "@/types";
import type { OrganizerProfile } from "@/types/organizer-profile";
import type { Tour } from "@/types/tour";
import { DEFAULT_ORGANIZER_OWNER_ID } from "@/types/user";
import {
  resolveOrganizerRatingDisplay,
  resolveOrganizerTourCountDisplay,
  resolveOrganizerTravelerCountDisplay,
} from "@/lib/tour-public-display";
import { resolveOrganizerExperienceStat } from "@/lib/organizer-experience";
import { enrichTourOrganizerDetail } from "@/lib/organizer-experience-enrich";
import { formatTours } from "@/lib/pluralize";

export interface PublicOrganizerProfile {
  slug: string;
  name: string;
  avatar: string | null;
  shortDescription: string;
  extendedDescription: string;
  statusText: string;
  languages: string[];
  experienceStat: string;
  ratingLabel: string;
  ratingIsNew: boolean;
  tourCountLabel: string;
  travelerCountLabel: string | null;
  platformRegisteredAt?: string;
  publishedTourCount: number;
}

export interface PlatformStats {
  tourCount: number;
  organizerCount: number;
  completedBookingsCount: number | null;
  isNewPlatform: boolean;
}

export function getOrganizerSlug(ownerUserId: string): string {
  return ownerUserId;
}

export function buildOrganizerPublicHref(slug: string): string {
  return `/organizers/${encodeURIComponent(slug)}`;
}

export function buildOrganizerCatalogHref(slug: string): string {
  return `/tours?${new URLSearchParams({ organizer: slug }).toString()}`;
}

export function resolveTourOwnerUserId(tour: Pick<Tour, "organizerTourId">): string {
  if (tour.organizerTourId) {
    return getOrganizerTourOwnerId(tour.organizerTourId) ?? DEFAULT_ORGANIZER_OWNER_ID;
  }
  return DEFAULT_ORGANIZER_OWNER_ID;
}

export function resolveListingOwnerUserId(listing: Pick<TourListing, "organizerOwnerId">): string {
  return listing.organizerOwnerId ?? DEFAULT_ORGANIZER_OWNER_ID;
}

export function isKnownOrganizerSlug(slug: string): boolean {
  if (!slug.trim()) return false;
  if (SEED_USERS.some((user) => user.id === slug && user.roles?.includes("organizer"))) {
    return true;
  }
  const tours = getAllCanonicalTours();
  return tours.some((tour) => resolveTourOwnerUserId(tour) === slug);
}

function aggregateOrganizerDetail(
  slug: string,
  publishedTourCount: number
): { detail: TourOrganizerDetail; totalReviewCount: number } {
  const tours = getAllCanonicalTours().filter(
    (tour) => resolveTourOwnerUserId(tour) === slug && tour.status === "published"
  );

  let ratingSum = 0;
  let ratingWeight = 0;
  let travelerCount = 0;
  let totalReviewCount = 0;

  for (const tour of tours) {
    if (tour.social.reviewCount > 0) {
      ratingSum += tour.social.rating * tour.social.reviewCount;
      ratingWeight += tour.social.reviewCount;
      totalReviewCount += tour.social.reviewCount;
    }
    travelerCount += tour.team.organizerDetail.travelerCount;
  }

  const sample = tours[0]?.team.organizerDetail;
  const canonical = getOrganizerCanonicalStats(slug);
  const rating = ratingWeight > 0 ? ratingSum / ratingWeight : 0;

  const base: TourOrganizerDetail = {
    id: slug,
    name: sample?.name ?? "Организатор",
    role: sample?.role ?? "Организатор путешествия",
    avatar: sample?.avatar ?? "",
    rating: canonical ? 0 : rating,
    tourCount: canonical?.tourCount ?? publishedTourCount,
    travelerCount: canonical?.travelerCount ?? travelerCount,
    languages: sample?.languages ?? [],
    experienceYears: canonical ? 0 : sample?.experienceYears ?? 0,
    platformRegisteredAt: canonical?.platformRegisteredAt,
    phone: "",
    email: "",
  };

  const enriched = enrichTourOrganizerDetail(
    {
      ...base,
      slug,
      ownerUserId: slug,
    },
    slug
  );

  return { detail: enriched, totalReviewCount };
}

export function buildPublicOrganizerProfile(slug: string): PublicOrganizerProfile | null {
  if (!isKnownOrganizerSlug(slug)) return null;

  const profile = readOrganizerProfile(slug);
  const user = SEED_USERS.find((item) => item.id === slug);
  const publishedTours = getPublishedToursByOrganizer(slug);
  const { detail: organizer, totalReviewCount } = aggregateOrganizerDetail(
    slug,
    publishedTours.length
  );
  const rating = resolveOrganizerRatingDisplay({
    rating: organizer.rating,
    reviewCount: totalReviewCount,
  });
  const tourCountFallback = resolveOrganizerTourCountDisplay(organizer.tourCount);

  return {
    slug,
    name: user ? joinFullName(user.firstName, user.lastName) : organizer.name,
    avatar: user?.avatar ?? organizer.avatar ?? null,
    shortDescription: profile.shortDescription || organizer.shortDescription || "",
    extendedDescription: profile.extendedDescription || organizer.extendedDescription || "",
    statusText: profile.statusText.trim(),
    languages: organizer.languages,
    experienceStat: resolveOrganizerExperienceStat(organizer),
    ratingLabel: rating.label,
    ratingIsNew: rating.isNew,
    tourCountLabel: tourCountFallback ?? formatTours(organizer.tourCount),
    travelerCountLabel: resolveOrganizerTravelerCountDisplay(organizer.travelerCount),
    platformRegisteredAt: organizer.platformRegisteredAt,
    publishedTourCount: publishedTours.length,
  };
}

export function getPublishedToursByOrganizer(slug: string): TourListing[] {
  return getMarketplaceListings().filter(
    (listing) => resolveListingOwnerUserId(listing) === slug
  );
}

export function getPlatformStatsFromRepository(): PlatformStats {
  const listings = filterArgentinaHomepageTours(getMarketplaceListings());
  const organizerIds = new Set(listings.map((listing) => resolveListingOwnerUserId(listing)));

  return {
    tourCount: listings.length,
    organizerCount: organizerIds.size,
    completedBookingsCount: null,
    isNewPlatform: listings.length <= 3,
  };
}

export function mergePlatformStats(
  base: PlatformStats,
  completedBookingsCount: number
): PlatformStats {
  return {
    ...base,
    completedBookingsCount,
    isNewPlatform: base.tourCount <= 3 && completedBookingsCount === 0,
  };
}

export function readOrganizerProfileFields(slug: string): Pick<
  OrganizerProfile,
  "shortDescription" | "extendedDescription" | "statusText"
> {
  const profile = readOrganizerProfile(slug);
  return {
    shortDescription: profile.shortDescription,
    extendedDescription: profile.extendedDescription,
    statusText: profile.statusText,
  };
}
