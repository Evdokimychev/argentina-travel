import { getAllDestinations, getDestinationBySlug } from "@/lib/destinations";
import type { DestinationPage } from "@/data/destination-pages";
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
  destinationPageFromCms,
  type CmsDocument,
} from "@/types/cms-content";

export {
  fetchPublishedCmsDocument as fetchPublishedDestinationOverride,
} from "@/lib/cms/content-resolver";

export function destinationOverrideId(slug: string, locale = "ru"): string {
  return cmsOverrideId("destination", slug, locale);
}

export async function fetchPublishedDestinationsFromCms(locale = "ru"): Promise<CmsDocument[]> {
  const supabase = await getCmsServerClient();
  if (!supabase) return [];
  return fetchPublishedCmsDocumentsMergedByLocaleChain(supabase, "destination", locale);
}

/** CMS destinations override TS entries by slug and can add CMS-only slugs. */
export function mergeDestinationCatalog(
  fileDestinations: DestinationPage[],
  cmsDestinations: CmsDocument[]
): DestinationPage[] {
  const mergedBySlug = new Map(fileDestinations.map((item) => [item.id, item] as const));
  const sourceOrder = fileDestinations.map((item) => item.id);
  const sourceSet = new Set(sourceOrder);

  for (const cmsDoc of cmsDestinations) {
    if (cmsDoc.body.kind !== "destination" || !isCmsDocumentComplete(cmsDoc)) continue;
    const fallback = mergedBySlug.get(cmsDoc.slug);
    const merged = destinationPageFromCms(cmsDoc, fallback);
    if (merged) mergedBySlug.set(merged.id, merged);
  }

  const ordered = sourceOrder
    .map((slug) => mergedBySlug.get(slug))
    .filter((item): item is DestinationPage => Boolean(item));
  const cmsOnly = [...mergedBySlug.values()]
    .filter((item) => !sourceSet.has(item.id))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  return [...ordered, ...cmsOnly];
}

export async function resolveDestinationCatalog(locale = "ru"): Promise<DestinationPage[]> {
  const fallback = getAllDestinations();
  const supabase = await getCmsServerClient();
  if (!supabase) return fallback;

  const cmsDestinations = await fetchPublishedCmsDocumentsMergedByLocaleChain(
    supabase,
    "destination",
    locale
  );
  if (cmsDestinations.length === 0) return fallback;

  return mergeDestinationCatalog(fallback, cmsDestinations);
}

/** Published CMS override merged with TS defaults for media and metadata. */
export async function resolveDestinationPage(
  slug: string,
  locale = "ru"
): Promise<DestinationPage | null> {
  const fallback = getDestinationBySlug(slug) ?? null;
  const supabase = await getCmsServerClient();
  const translationStatus = supabase
    ? await fetchCmsTranslationStatusForSlug(supabase, "destination", slug, {
        ruFallbackComplete: Boolean(fallback),
      })
    : buildDefaultTranslationStatus(Boolean(fallback));

  const resolved = await resolveWithPublishedCmsOverride({
    docType: "destination",
    slug,
    locale,
    fallback,
    merge: (doc, fb) => destinationPageFromCms(doc, fb),
    supabase,
    isUsable: isCmsDocumentComplete,
  });
  if (!resolved) return null;
  return attachCmsResolverMetadata(resolved, buildCmsResolverMetadata(locale, translationStatus));
}

export async function listPublishedDestinationSlugs(locale = "ru"): Promise<string[]> {
  const fallbackSlugs = getAllDestinations().map((destination) => destination.id);
  return listPublishedCmsSlugs("destination", fallbackSlugs, locale);
}
