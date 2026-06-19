import {
  fetchPlaceBySlugServer,
  fetchPlaceSlugsServer,
  fetchPlacesServer,
} from "@/lib/places-repository";
import type { PlaceDetail, PlaceListing } from "@/types/place";
import {
  cmsOverrideId,
  fetchPublishedCmsDocumentsByType,
  getCmsServerClient,
  listPublishedCmsSlugs,
  resolveWithPublishedCmsOverride,
} from "@/lib/cms/content-resolver";
import {
  placeDetailFromCms,
  type CmsDocument,
} from "@/types/cms-content";

export {
  fetchPublishedCmsDocument as fetchPublishedPlaceOverride,
} from "@/lib/cms/content-resolver";

export function placeOverrideId(slug: string, locale = "ru"): string {
  return cmsOverrideId("place", slug, locale);
}

function placeListingFromCms(doc: CmsDocument, fallback?: PlaceListing): PlaceListing | null {
  if (doc.body.kind !== "place") return null;
  const shortDescription = doc.body.shortDescription || fallback?.shortDescription || "";

  return {
    id: fallback?.id ?? `cms-place-${doc.slug}`,
    slug: doc.slug,
    name: doc.title,
    shortDescription,
    category: fallback?.category ?? "city",
    region: fallback?.region ?? "Аргентина",
    province: fallback?.province,
    city: fallback?.city,
    latitude: fallback?.latitude ?? -34.6037,
    longitude: fallback?.longitude ?? -58.3816,
    coverImage: fallback?.coverImage,
    tags: fallback?.tags ?? [],
    rating: fallback?.rating,
    visitDuration: fallback?.visitDuration,
    season: fallback?.season,
    ticketPrice: fallback?.ticketPrice,
    popularity: fallback?.popularity ?? 50,
  };
}

export async function fetchPublishedPlacesFromCms(locale = "ru"): Promise<CmsDocument[]> {
  const supabase = await getCmsServerClient();
  if (!supabase) return [];
  return fetchPublishedCmsDocumentsByType(supabase, "place", locale);
}

/** CMS places override source catalog by slug and can add CMS-only slugs. */
export function mergePlaceCatalog(filePlaces: PlaceListing[], cmsPlaces: CmsDocument[]): PlaceListing[] {
  const mergedBySlug = new Map(filePlaces.map((item) => [item.slug, item] as const));
  const sourceOrder = filePlaces.map((item) => item.slug);
  const sourceSet = new Set(sourceOrder);

  for (const cmsDoc of cmsPlaces) {
    const fallback = mergedBySlug.get(cmsDoc.slug);
    const merged = placeListingFromCms(cmsDoc, fallback);
    if (merged) mergedBySlug.set(merged.slug, merged);
  }

  const ordered = sourceOrder
    .map((slug) => mergedBySlug.get(slug))
    .filter((item): item is PlaceListing => Boolean(item));
  const cmsOnly = [...mergedBySlug.values()]
    .filter((item) => !sourceSet.has(item.slug))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  return [...ordered, ...cmsOnly];
}

export async function resolvePlaceCatalog(locale = "ru"): Promise<PlaceListing[]> {
  const fallback = await fetchPlacesServer();
  const supabase = await getCmsServerClient();
  if (!supabase) return fallback;

  const cmsPlaces = await fetchPublishedCmsDocumentsByType(supabase, "place", locale);
  if (cmsPlaces.length === 0) return fallback;

  return mergePlaceCatalog(fallback, cmsPlaces);
}

/** Published CMS override merged with source place data by slug. */
export async function resolvePlacePage(slug: string, locale = "ru"): Promise<PlaceDetail | null> {
  const fallback = await fetchPlaceBySlugServer(slug);

  return resolveWithPublishedCmsOverride({
    docType: "place",
    slug,
    locale,
    fallback,
    merge: (doc, fb) => placeDetailFromCms(doc, fb),
  });
}

export async function listPublishedPlaceSlugs(locale = "ru"): Promise<string[]> {
  const fallbackSlugs = await fetchPlaceSlugsServer();
  return listPublishedCmsSlugs("place", fallbackSlugs, locale);
}
