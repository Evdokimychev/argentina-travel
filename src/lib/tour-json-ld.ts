import type { TourDetail, TourReview } from "@/types";
import { getSiteUrl } from "@/lib/site-url";

const MAX_JSON_LD_REVIEWS = 10;

function buildSingleReviewJsonLd(review: TourReview, productName: string) {
  if (!review.text.trim()) return null;

  return {
    "@type": "Review",
    author: {
      "@type": "Person",
      name: review.author || "Путешественник",
    },
    datePublished: review.date || review.tripDate || undefined,
    reviewBody: review.text.trim(),
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    itemReviewed: {
      "@type": "Product",
      name: productName,
    },
  };
}

export function buildTourProductJsonLd(tour: TourDetail, siteUrl = getSiteUrl()) {
  const url = `${siteUrl}/tours/${tour.slug}`;
  const platformReviews = tour.reviews
    .filter((review) => review.source === "platform" && review.text.trim())
    .slice(0, MAX_JSON_LD_REVIEWS)
    .map((review) => buildSingleReviewJsonLd(review, tour.title))
    .filter(Boolean);

  const aggregateRating =
    tour.reviewCount > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: tour.rating,
          reviewCount: tour.reviewCount,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: tour.title,
    description: tour.shortDescription,
    image: tour.gallery.length ? tour.gallery : [tour.image],
    url,
    brand: {
      "@type": "Organization",
      name: tour.organizer.name,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: tour.priceUsd,
      availability: "https://schema.org/InStock",
      url,
    },
    aggregateRating,
    review: platformReviews.length ? platformReviews : undefined,
  };
}
