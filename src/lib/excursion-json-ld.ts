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

/** Scheduled bookable experiences also expose Event for rich results. */
export function buildExcursionEventJsonLd(excursion: ExcursionDetail) {
  if (excursion.isBookable === false) return null;

  const location = excursion.cityName
    ? {
        "@type": "Place",
        name: excursion.cityName,
        ...(excursion.meetingPoint?.text
          ? { address: { "@type": "PostalAddress", streetAddress: excursion.meetingPoint.text } }
          : {}),
      }
    : undefined;

  return {
    "@type": "Event",
    name: excursion.title,
    description: excursion.annotation || excursion.tagline || excursion.title,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    url: absoluteUrl(`/excursions/${excursion.slug}`),
    location,
    offers: buildExcursionOffers(excursion),
    aggregateRating: buildExcursionAggregateRating(excursion),
  };
}

export function buildExcursionJsonLd(excursion: ExcursionDetail) {
  const graph = [
    buildExcursionTouristTripJsonLd(excursion),
    buildExcursionEventJsonLd(excursion),
  ].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}
