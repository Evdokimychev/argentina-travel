import type { Metadata } from "next";
import type { PlaceDetail, PlaceListing } from "@/types/place";
import { absoluteUrl, resolvePublicUrl } from "@/lib/site-url";
import { placeHref } from "@/lib/places-repository";

export function buildPlaceMetadata(place: PlaceDetail): Metadata {
  const pageUrl = absoluteUrl(placeHref(place.slug));
  const imageUrl = place.coverImage ? resolvePublicUrl(place.coverImage) : undefined;

  return {
    title: `${place.name} — места Аргентины`,
    description: place.shortDescription,
    openGraph: {
      title: place.name,
      description: place.shortDescription,
      type: "website",
      url: pageUrl,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: place.name,
      description: place.shortDescription,
      images: imageUrl ? [imageUrl] : undefined,
    },
    alternates: {
      canonical: pageUrl,
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
  };
}

export function buildPlacesCatalogMetadata(count: number): Metadata {
  const pageUrl = absoluteUrl("/places");
  return {
    title: "Места Аргентины — справочник путешественника",
    description: `${count} мест: национальные парки, города, ледники, водопады и заповедники. Поиск, карта и подборки маршрутов.`,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: "Места Аргентины — справочник путешественника",
      description: `${count} мест: национальные парки, города, ледники, водопады и заповедники.`,
      type: "website",
      url: pageUrl,
    },
  };
}

export function buildPlaceSearchKeywords(place: PlaceListing): string[] {
  return [place.name, place.region, place.province, place.city, ...place.tags].filter(
    Boolean,
  ) as string[];
}
