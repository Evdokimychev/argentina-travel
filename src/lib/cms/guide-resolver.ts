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
import { getGuideTopicBySlug } from "@/lib/guide-topics";
import type { GuideTopicPage } from "@/types/guide-topic";

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

  let resolvedSeo: CmsDocument["seo"] | undefined;
  const resolved = await resolveWithPublishedCmsOverride({
    docType: "guide",
    slug,
    locale,
    fallback,
    merge: (doc, fb) => guidePageFromCms(doc, fb),
    supabase,
    isUsable: isCmsDocumentComplete,
    onResolvedDocument: (doc) => {
      resolvedSeo = doc.seo;
    },
  });
  if (!resolved) return null;
  return attachCmsResolverMetadata(
    resolved,
    buildCmsResolverMetadata(locale, translationStatus, resolvedSeo),
  );
}

export async function listPublishedGuideSlugs(locale = "ru"): Promise<string[]> {
  const cutover = await getCmsCutoverFlags();
  const fallbackSlugs = getPagesBySection("guide").map((page) => page.slug);
  return listPublishedCmsSlugs("guide", fallbackSlugs, locale, { cmsOnly: cutover.guide });
}

/**
 * Core guide topics used to win routing before the CMS resolver ran. Attach a
 * published CMS page as the editable editorial body while preserving the rich
 * pillar shell (facts, widgets, FAQ and recommendations).
 */
export function mergeGuideTopicWithCmsPage(
  topic: GuideTopicPage,
  cmsPage: ContentPage | null,
): GuideTopicPage {
  const hasEditorialBody = cmsPage?.sections.some((section) =>
    Boolean(
      section.heading?.trim() ||
        section.html?.trim() ||
        section.paragraphs?.some((paragraph) => paragraph.trim()) ||
        section.list?.some((item) => item.trim()) ||
        section.blocks?.length,
    ),
  );
  if (!cmsPage || !hasEditorialBody) return topic;

  const relatedByHref = new Map(
    (topic.relatedArticles ?? []).map((item) => [item.href, item] as const),
  );
  for (const item of cmsPage.relatedLinks ?? []) {
    relatedByHref.set(item.href, {
      label: item.label,
      href: item.href,
      description: item.description,
    });
  }

  return {
    ...topic,
    title: cmsPage.title.trim() || topic.title,
    shortDescription: cmsPage.description.trim() || topic.shortDescription,
    relatedArticles: [...relatedByHref.values()],
    cmsPage,
  };
}

export async function resolveGuideTopic(
  slug: string,
  locale = "ru",
): Promise<GuideTopicPage | null> {
  const topic = getGuideTopicBySlug(slug);
  if (!topic) return null;
  const cmsPage = await resolveGuidePage(slug, locale);
  return mergeGuideTopicWithCmsPage(topic, cmsPage);
}
