import type { Metadata } from "next";
import type { ReadonlyURLSearchParams } from "next/navigation";
import type { PlaceListing } from "@/types/place";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { getPlacesCatalogHeroImage } from "@/lib/media-resolver";
import { getServerSyncMessages } from "@/lib/i18n/sync-messages";
import type { I18nLocale } from "@/lib/i18n/config";
import { resolvePublicUrl } from "@/lib/site-url";
import {
  filterPlaces,
  parsePlaceFiltersFromSearchParams,
  sortPlaces,
} from "@/lib/places-catalog-filters";

function toSearchParams(
  input: Record<string, string | string[] | undefined>
): ReadonlyURLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
    } else {
      params.set(key, value);
    }
  }
  return params as ReadonlyURLSearchParams;
}

function describeActivePlaceFilters(params: ReadonlyURLSearchParams): string[] {
  const filters = parsePlaceFiltersFromSearchParams(params);
  const parts: string[] = [];

  if (filters.query.trim()) parts.push(`поиск «${filters.query.trim()}»`);
  if (filters.category) parts.push(filters.category);
  if (filters.region) parts.push(filters.region);
  if (filters.province) parts.push(filters.province);
  if (filters.season) parts.push(filters.season);
  if (filters.tag) parts.push(filters.tag);

  return parts;
}

export function getServerPlacesCatalogView(
  searchParams: Record<string, string | string[] | undefined>,
  places: PlaceListing[]
) {
  const params = toSearchParams(searchParams);
  const filters = parsePlaceFiltersFromSearchParams(params);
  const filtered = filterPlaces(places, filters);
  const sorted = sortPlaces(filtered, filters.sort);

  return { filters, filtered: sorted, total: places.length };
}

export function buildPlacesCatalogPageMetadata(
  searchParams: Record<string, string | string[] | undefined>,
  places: PlaceListing[],
  locale?: I18nLocale
): Metadata {
  const params = toSearchParams(searchParams);
  const view = getServerPlacesCatalogView(searchParams, places);
  const filterParts = describeActivePlaceFilters(params);
  const count = view.filtered.length;
  const messages = getServerSyncMessages(locale);

  const baseTitle = messages["places.title"] ?? "Места Аргентины";
  const baseDescription =
    messages["places.subtitle"] ??
    `${count} мест: национальные парки, города, ледники, водопады и заповедники.`;

  const title =
    filterParts.length > 0
      ? `${baseTitle} — ${filterParts.slice(0, 2).join(", ")}`
      : `${baseTitle} — справочник путешественника`;

  const description =
    filterParts.length > 0
      ? `${count} ${count === 1 ? "место" : count < 5 ? "места" : "мест"} по фильтрам: ${filterParts.join(", ")}. ${baseDescription}`
      : `${places.length} ${places.length === 1 ? "место" : places.length < 5 ? "места" : "мест"}: ${baseDescription}`;

  const canonicalQuery = params.toString();
  const canonicalPath = canonicalQuery ? `/places?${canonicalQuery}` : "/places";
  const heroImage = resolvePublicUrl(getPlacesCatalogHeroImage());

  return {
    title,
    description,
    alternates: {
      ...buildHreflangAlternates("/places"),
      canonical: canonicalPath,
    },
    ...(filterParts.length > 0 ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: heroImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [heroImage],
    },
  };
}

export function buildPlacesCatalogJsonLd(
  places: PlaceListing[],
  locale?: I18nLocale
): { name: string; description: string } {
  const messages = getServerSyncMessages(locale);
  const baseTitle = messages["places.title"] ?? "Места Аргентины";
  const baseDescription =
    messages["places.subtitle"] ??
    "Парки, города, ледники и водопады Аргентины — поиск, карта, фильтры и тематические подборки.";

  return {
    name: `${baseTitle} — ${places.length} локаций`,
    description: baseDescription,
  };
}
