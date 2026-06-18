import type { TourDetail } from "@/types";
import { getSiteUrl } from "@/lib/site-url";

export function buildTourProductJsonLd(tour: TourDetail, siteUrl = getSiteUrl()) {
  const url = `${siteUrl}/tours/${tour.slug}`;

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
    aggregateRating:
      tour.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: tour.rating,
            reviewCount: tour.reviewCount,
          }
        : undefined,
  };
}
