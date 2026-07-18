import type { ExcursionDetail } from "@/types/excursion";
import { absoluteUrl } from "@/lib/site-url";

function buildExcursionOffers(excursion: ExcursionDetail) {
  if (!excursion.priceValue) return undefined;

  return {
    "@type": "Offer",
    price: excursion.priceValue,
    priceCurrency: excursion.priceCurrency || "USD",
    url: excursion.bookingHref,
    availability:
      excursion.isBookable === false
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
  };
}

function buildExcursionAggregateRating(excursion: ExcursionDetail) {
  if (excursion.rating == null || excursion.reviewCount <= 0) return undefined;

  return {
    "@type": "AggregateRating",
    ratingValue: excursion.rating,
    reviewCount: excursion.reviewCount,
    bestRating: 5,
    worstRating: 1,
  };
}

export function buildExcursionTouristTripJsonLd(excursion: ExcursionDetail) {
  const images = excursion.photos
    .map((photo) => photo.medium || photo.thumbnail)
    .filter(Boolean) as string[];

  return {
    "@type": "TouristTrip",
    name: excursion.title,
    description: excursion.annotation || excursion.tagline || excursion.title,
    touristType: "Tourist",
    url: absoluteUrl(`/excursions/${excursion.slug}`),
    image: images.length ? images : excursion.coverImage ? [excursion.coverImage] : undefined,
    offers: buildExcursionOffers(excursion),
    aggregateRating: buildExcursionAggregateRating(excursion),
  };
}

export function buildExcursionJsonLd(excursion: ExcursionDetail) {
  return {
    "@context": "https://schema.org",
    // Event requires a concrete startDate and location. Detail data describes
    // a reusable excursion, so TouristTrip is the honest schema here.
    "@graph": [buildExcursionTouristTripJsonLd(excursion)],
  };
}
