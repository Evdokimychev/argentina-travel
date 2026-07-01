import type { DestinationPage } from "@/data/destination-pages";
import type { TourListing } from "@/types";
import type { PlaceListing } from "@/types/place";
import { destinationHref } from "@/lib/destinations";
import type { I18nLocale } from "@/lib/i18n/config";
import { getServerSyncMessages } from "@/lib/i18n/sync-messages";
import { placeHref } from "@/lib/places-repository";
import { absoluteUrl, resolvePublicUrl } from "@/lib/site-url";

export const MAX_CATALOG_ITEM_LIST = 50;

function resolveCatalogListName(
  locale: I18nLocale | undefined,
  key: string,
  fallback: string
): string {
  const messages = getServerSyncMessages(locale);
  const value = messages[key] ?? fallback;
  return value;
}

export function buildToursCatalogItemListJsonLd(
  tours: TourListing[],
  locale?: I18nLocale
) {
  const capped = tours.slice(0, MAX_CATALOG_ITEM_LIST);
  const name = resolveCatalogListName(
    locale,
    "tours.catalog.title",
    "Каталог туров по Аргентине"
  );

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: absoluteUrl("/tours"),
    numberOfItems: tours.length,
    itemListElement: capped.map((tour, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: tour.title,
        description: tour.shortDescription,
        url: absoluteUrl(`/tours/${tour.slug}`),
        ...(tour.image ? { image: resolvePublicUrl(tour.image) } : {}),
      },
    })),
  };
}

export function buildPlacesCatalogItemListJsonLd(
  places: PlaceListing[],
  locale?: I18nLocale
) {
  const capped = places.slice(0, MAX_CATALOG_ITEM_LIST);
  const name = resolveCatalogListName(locale, "places.title", "Места Аргентины");

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: absoluteUrl("/places"),
    numberOfItems: places.length,
    itemListElement: capped.map((place, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "TouristAttraction",
        name: place.name,
        description: place.shortDescription,
        url: absoluteUrl(placeHref(place.slug)),
      },
    })),
  };
}

export function buildDestinationsCatalogItemListJsonLd(
  destinations: DestinationPage[],
  locale?: I18nLocale
) {
  const capped = destinations.slice(0, MAX_CATALOG_ITEM_LIST);
  const name = resolveCatalogListName(locale, "nav.geography", "Регионы и места");

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: absoluteUrl("/destinations"),
    numberOfItems: destinations.length,
    itemListElement: capped.map((destination, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "TouristDestination",
        name: destination.name,
        description: destination.intro,
        url: absoluteUrl(destinationHref(destination.id)),
        ...(destination.image ? { image: resolvePublicUrl(destination.image) } : {}),
      },
    })),
  };
}
