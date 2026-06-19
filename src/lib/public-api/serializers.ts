import type { TourListing } from "@/types";
import type { PublicApiExcursionListing, PublicApiPagination, PublicApiTourListing } from "@/types/public-api";
import type { ExcursionListing } from "@/types/excursion";
import { resolveListingOwnerUserId } from "@/lib/organizer-public";

function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.goargentina.ru").replace(/\/$/, "");
}

export function parsePublicApiPagination(searchParams: URLSearchParams): {
  page: number;
  pageSize: number;
} {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "24", 10) || 24));
  return { page, pageSize };
}

export function buildPublicApiPagination(
  total: number,
  page: number,
  pageSize: number
): PublicApiPagination {
  return {
    page,
    pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}

export function paginateItems<T>(items: T[], page: number, pageSize: number): T[] {
  const from = (page - 1) * pageSize;
  return items.slice(from, from + pageSize);
}

export function filterToursForPublicApi(
  tours: TourListing[],
  options?: { organizerSlug?: string | null; organizerId?: string | null }
): TourListing[] {
  let result = tours;

  if (options?.organizerId) {
    result = result.filter((tour) => resolveListingOwnerUserId(tour) === options.organizerId);
  }

  const organizerSlug = options?.organizerSlug?.trim();
  if (organizerSlug) {
    result = result.filter(
      (tour) =>
        resolveListingOwnerUserId(tour) === organizerSlug ||
        tour.organizer.slug === organizerSlug
    );
  }

  return result;
}

export function serializePublicTourListing(tour: TourListing): PublicApiTourListing {
  return {
    slug: tour.slug,
    title: tour.title,
    shortDescription: tour.shortDescription,
    image: tour.image,
    destination: tour.destination,
    region: tour.region,
    country: tour.country,
    activityType: tour.activityType,
    durationDays: tour.durationDays,
    durationNights: tour.durationNights,
    priceUsd: tour.priceUsd,
    originalPriceUsd: tour.originalPriceUsd,
    priceOnRequest: tour.priceOnRequest,
    rating: tour.rating,
    reviewCount: tour.reviewCount,
    organizer: {
      name: tour.organizer.name,
      slug: tour.organizer.slug ?? tour.organizerOwnerId,
      avatar: tour.organizer.avatar,
    },
    badges: tour.badges,
    isHot: tour.isHot,
    isNew: tour.isNew,
    isBestOfMonth: tour.isBestOfMonth,
    url: `${siteOrigin()}/tours/${encodeURIComponent(tour.slug)}`,
  };
}

export function serializePublicTourDetail(tour: import("@/types").TourDetail): Record<string, unknown> {
  const base = {
    slug: tour.slug,
    title: tour.title,
    shortDescription: tour.shortDescription,
    image: tour.image,
    destination: tour.region,
    region: tour.region,
    country: tour.country,
    durationDays: tour.durationDays,
    durationNights: tour.durationNights,
    priceUsd: tour.priceUsd,
    originalPriceUsd: tour.originalPriceUsd,
    priceOnRequest: tour.priceOnRequest,
    rating: tour.rating,
    reviewCount: tour.reviewCount,
    url: `${siteOrigin()}/tours/${encodeURIComponent(tour.slug)}`,
  };

  return {
    ...base,
    gallery: tour.gallery,
    descriptionBlocks: tour.descriptionBlocks,
    included: tour.included,
    excluded: tour.excluded,
    itinerary: tour.itinerary,
    faq: tour.faq,
    dates: tour.dates,
    bookingMode: tour.bookingMode,
    comfort: tour.comfort,
    difficulty: tour.difficulty,
    groupMin: tour.groupMin,
    groupMax: tour.groupMax,
    places: tour.places,
    accommodations: tour.accommodations,
    organizer: {
      name: tour.organizer.name,
      slug: tour.organizer.slug,
      avatar: tour.organizer.avatar,
    },
    reviews: tour.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      author: review.author,
      text: review.text,
      date: review.date,
    })),
  };
}

export function serializePublicExcursionListing(excursion: ExcursionListing): PublicApiExcursionListing {
  return {
    slug: excursion.slug,
    title: excursion.title,
    tagline: excursion.tagline,
    citySlug: excursion.citySlug,
    cityName: excursion.cityName,
    coverImage: excursion.coverImage,
    partner: excursion.partner,
    rating: excursion.rating,
    reviewCount: excursion.reviewCount,
    priceValue: excursion.priceValue,
    priceCurrency: excursion.priceCurrency,
    priceDisplay: excursion.priceDisplay,
    durationMinutes: excursion.durationMinutes,
    format: excursion.format,
    url: `${siteOrigin()}/excursions/${encodeURIComponent(excursion.slug)}`,
  };
}
