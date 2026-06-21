import {
  fetchPublishedCmsDocumentsForCutover,
  getCmsCutoverFlags,
  placeListingsFromCmsDocuments,
} from "@/lib/cms/cms-cutover";
import {
  fetchPlaceBySlugServer,
  fetchPlaceSlugsServer,
  fetchPlacesServer,
} from "@/lib/places-repository";
import type { PlaceDetail, PlaceListing } from "@/types/place";
import {
  attachCmsResolverMetadata,
  buildCmsResolverMetadata,
  cmsOverrideId,
  fetchCmsTranslationStatusForSlug,
  fetchPublishedCmsDocumentsMergedByLocaleChain,
  getCmsServerClient,
  listPublishedCmsSlugs,
  resolveWithPublishedCmsOverride,
} from "@/lib/cms/content-resolver";
import { buildDefaultTranslationStatus, isCmsDocumentComplete } from "@/lib/cms/translation-status";
import {
  placeDetailFromCms,
  type CmsDocument,
} from "@/types/cms-content";
import { placeListingFromCmsDocument } from "@/lib/cms/place-listing-from-cms";

export {
  fetchPublishedCmsDocument as fetchPublishedPlaceOverride,
} from "@/lib/cms/content-resolver";

export function placeOverrideId(slug: string, locale = "ru"): string {
  return cmsOverrideId("place", slug, locale);
}

function placeListingFromCms(doc: CmsDocument, fallback?: PlaceListing): PlaceListing | null {
  return placeListingFromCmsDocument(doc, fallback);
}

export async function fetchPublishedPlacesFromCms(locale = "ru"): Promise<CmsDocument[]> {
  const supabase = await getCmsServerClient();
  if (!supabase) return [];
  return fetchPublishedCmsDocumentsMergedByLocaleChain(supabase, "place", locale);
}

/** CMS places override source catalog by slug and can add CMS-only slugs. */
export function mergePlaceCatalog(filePlaces: PlaceListing[], cmsPlaces: CmsDocument[]): PlaceListing[] {
  const mergedBySlug = new Map(filePlaces.map((item) => [item.slug, item] as const));
  const sourceOrder = filePlaces.map((item) => item.slug);
  const sourceSet = new Set(sourceOrder);

  for (const cmsDoc of cmsPlaces) {
    if (!isCmsDocumentComplete(cmsDoc)) continue;
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
  const cutover = await getCmsCutoverFlags();
  const supabase = await getCmsServerClient();

  if (cutover.place) {
    if (!supabase) return [];
    const cmsPlaces = await fetchPublishedCmsDocumentsForCutover("place", locale);
    const orderSlugs = await fetchPlaceSlugsServer();
    return placeListingsFromCmsDocuments(cmsPlaces, orderSlugs);
  }

  const fallback = await fetchPlacesServer();
  if (!supabase) return fallback;

  const cmsPlaces = await fetchPublishedCmsDocumentsMergedByLocaleChain(supabase, "place", locale);
  if (cmsPlaces.length === 0) return fallback;

  return mergePlaceCatalog(fallback, cmsPlaces);
}

/** Published CMS override merged with source place data by slug. */
export async function resolvePlacePage(slug: string, locale = "ru"): Promise<PlaceDetail | null> {
  const cutover = await getCmsCutoverFlags();
  const fallback = cutover.place ? null : await fetchPlaceBySlugServer(slug);
  const supabase = await getCmsServerClient();
  const translationStatus = supabase
    ? await fetchCmsTranslationStatusForSlug(supabase, "place", slug, {
        ruFallbackComplete: cutover.place ? false : Boolean(fallback),
      })
    : buildDefaultTranslationStatus(cutover.place ? false : Boolean(fallback));

  const resolved = await resolveWithPublishedCmsOverride({
    docType: "place",
    slug,
    locale,
    fallback,
    merge: (doc, fb) => placeDetailFromCms(doc, fb),
    supabase,
    isUsable: isCmsDocumentComplete,
  });
  if (!resolved) return null;
  return attachCmsResolverMetadata(resolved, buildCmsResolverMetadata(locale, translationStatus));
}

export async function listPublishedPlaceSlugs(locale = "ru"): Promise<string[]> {
  const cutover = await getCmsCutoverFlags();
  const fallbackSlugs = await fetchPlaceSlugsServer();
  return listPublishedCmsSlugs("place", fallbackSlugs, locale, { cmsOnly: cutover.place });
}
