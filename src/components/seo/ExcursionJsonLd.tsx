import type { ExcursionDetail } from "@/types/excursion";

export default function ExcursionJsonLd({ excursion }: { excursion: ExcursionDetail }) {
  const images = excursion.photos
    .map((photo) => photo.medium || photo.thumbnail)
    .filter(Boolean) as string[];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: excursion.title,
    description: excursion.annotation || excursion.tagline || excursion.title,
    touristType: "Tourist",
    image: images.length ? images : excursion.coverImage ? [excursion.coverImage] : undefined,
    offers: excursion.priceValue
      ? {
          "@type": "Offer",
          price: excursion.priceValue,
          priceCurrency: excursion.priceCurrency || "USD",
          url: excursion.bookingHref,
        }
      : undefined,
    aggregateRating:
      excursion.rating != null && excursion.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: excursion.rating,
            reviewCount: excursion.reviewCount,
          }
        : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
