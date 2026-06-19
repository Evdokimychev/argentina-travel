import type { Metadata } from "next";
import type { PlaceDetail, PlaceListing } from "@/types/place";
import { absoluteUrl } from "@/lib/site-url";
import { placeHref } from "@/lib/places-repository";

export function buildPlaceMetadata(place: PlaceDetail): Metadata {
  return {
    title: `${place.name} — места Аргентины`,
    description: place.shortDescription,
    openGraph: {
      title: place.name,
      description: place.shortDescription,
      type: "website",
      images: place.coverImage ? [{ url: place.coverImage }] : undefined,
    },
    alternates: {
      canonical: placeHref(place.slug),
    },
  };
}

export function buildPlaceProductJsonLd(place: PlaceDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: place.name,
    description: place.shortDescription,
    image: place.gallery.length ? place.gallery : place.coverImage ? [place.coverImage] : undefined,
    geo: {
      "@type": "GeoCoordinates",
      latitude: place.latitude,
      longitude: place.longitude,
    },
    address: {
      "@type": "PostalAddress",
      addressRegion: place.province ?? place.region,
      addressCountry: "AR",
    },
    url: absoluteUrl(placeHref(place.slug)),
    aggregateRating:
      place.rating != null
        ? {
            "@type": "AggregateRating",
            ratingValue: place.rating,
            bestRating: 5,
            ratingCount: Math.max(10, place.popularity),
          }
        : undefined,
  };
}

export function buildPlacesCatalogMetadata(count: number): Metadata {
  return {
    title: "Места Аргентины — справочник путешественника",
    description: `${count} мест: национальные парки, города, ледники, водопады и заповедники. Поиск, карта и подборки маршрутов.`,
    alternates: { canonical: "/places" },
  };
}

export function buildPlaceSearchKeywords(place: PlaceListing): string[] {
  return [place.name, place.region, place.province, place.city, ...place.tags].filter(
    Boolean,
  ) as string[];
}
