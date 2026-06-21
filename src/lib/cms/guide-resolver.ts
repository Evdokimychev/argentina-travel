import { getPagesBySection, getContentPage } from "@/lib/content-pages";
import type { ContentPage } from "@/types/content-page";
import {
  fetchPublishedCmsDocumentsForCutover,
  getCmsCutoverFlags,
  guidePagesFromCmsDocuments,
} from "@/lib/cms/cms-cutover";
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
  guidePageFromCms,
  type CmsDocument,
} from "@/types/cms-content";

export {
  fetchPublishedCmsDocument as fetchPublishedGuideOverride,
} from "@/lib/cms/content-resolver";

export function guideOverrideId(slug: string, locale = "ru"): string {
  return cmsOverrideId("guide", slug, locale);
}

/** CMS guide pages override TS entries by slug and can add CMS-only slugs. */
export function mergeGuideCatalog(filePages: ContentPage[], cmsDocs: CmsDocument[]): ContentPage[] {
  const mergedBySlug = new Map(filePages.map((page) => [page.slug, page] as const));
  const sourceOrder = filePages.map((page) => page.slug);
  const sourceSet = new Set(sourceOrder);

  for (const cmsDoc of cmsDocs) {
    if (cmsDoc.body.kind !== "guide" || !isCmsDocumentComplete(cmsDoc)) continue;
    const fallback = mergedBySlug.get(cmsDoc.slug);
    const merged = guidePageFromCms(cmsDoc, fallback);
    if (merged) mergedBySlug.set(merged.slug, merged);
  }

  const ordered = sourceOrder
    .map((slug) => mergedBySlug.get(slug))
    .filter((page): page is ContentPage => Boolean(page));
  const cmsOnly = [...mergedBySlug.values()]
    .filter((page) => !sourceSet.has(page.slug))
    .sort((a, b) => a.title.localeCompare(b.title, "ru"));

  return [...ordered, ...cmsOnly];
}

export async function resolveGuideCatalog(locale = "ru"): Promise<ContentPage[]> {
  const cutover = await getCmsCutoverFlags();
  const supabase = await getCmsServerClient();

  if (cutover.guide) {
    if (!supabase) return [];
    const cmsGuides = await fetchPublishedCmsDocumentsForCutover("guide", locale);
    return guidePagesFromCmsDocuments(cmsGuides);
  }

  const fallback = getPagesBySection("guide");
  if (!supabase) return fallback;

  const cmsGuides = await fetchPublishedCmsDocumentsMergedByLocaleChain(supabase, "guide", locale);
  if (cmsGuides.length === 0) return fallback;

  return mergeGuideCatalog(fallback, cmsGuides);
}

/** Published DB override takes precedence over TS file. */
export async function resolveGuidePage(slug: string, locale = "ru"): Promise<ContentPage | null> {
  const cutover = await getCmsCutoverFlags();
  const fallback = cutover.guide ? null : (getContentPage("guide", slug) ?? null);
  const supabase = await getCmsServerClient();
  const translationStatus = supabase
    ? await fetchCmsTranslationStatusForSlug(supabase, "guide", slug, {
        ruFallbackComplete: cutover.guide ? false : Boolean(fallback),
      })
    : buildDefaultTranslationStatus(cutover.guide ? false : Boolean(fallback));

  const resolved = await resolveWithPublishedCmsOverride({
    docType: "guide",
    slug,
    locale,
    fallback,
    merge: (doc, fb) => guidePageFromCms(doc, fb),
    supabase,
    isUsable: isCmsDocumentComplete,
  });
  if (!resolved) return null;
  return attachCmsResolverMetadata(resolved, buildCmsResolverMetadata(locale, translationStatus));
}

export async function listPublishedGuideSlugs(locale = "ru"): Promise<string[]> {
  const cutover = await getCmsCutoverFlags();
  const fallbackSlugs = getPagesBySection("guide").map((page) => page.slug);
  return listPublishedCmsSlugs("guide", fallbackSlugs, locale, { cmsOnly: cutover.guide });
}
