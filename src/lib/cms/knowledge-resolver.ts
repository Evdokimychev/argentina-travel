import {
  attachCmsResolverMetadata,
  buildCmsResolverMetadata,
  fetchPublishedCmsDocumentsMergedByLocaleChain,
  fetchCmsTranslationStatusForSlug,
  getCmsServerClient,
  listPublishedCmsSlugs,
  resolveWithPublishedCmsOverride,
} from "@/lib/cms/content-resolver";
import { buildDefaultTranslationStatus, isCmsDocumentComplete } from "@/lib/cms/translation-status";
import { getAllEntries, getAllEntryIds, getEntry, KB_SECTIONS } from "@/lib/knowledge-base/content";
import type { KbEntry, KbEntryType } from "@/lib/knowledge-base/types";
import type { CmsDocument } from "@/types/cms-content";

const KB_ENTRY_TYPES = new Set<KbEntryType>([
  "city",
  "guide",
  "faq",
  "author_tip",
  "national_park",
  "attraction",
  "region",
  "route",
  "transport",
]);

function resolveEntryType(value: string | undefined, fallback?: KbEntryType): KbEntryType {
  return value && KB_ENTRY_TYPES.has(value as KbEntryType)
    ? (value as KbEntryType)
    : (fallback ?? "guide");
}

function resolveSectionId(value: string | undefined, fallback: string[] | undefined): string[] {
  if (!value) return fallback ?? [];
  const section = KB_SECTIONS.find((item) => item.id === value || item.slug === value);
  return section ? [section.id] : (fallback ?? []);
}

export function knowledgeEntryFromCms(doc: CmsDocument, fallback?: KbEntry): KbEntry | null {
  if (doc.docType !== "knowledge" || doc.body.kind !== "blog") return null;
  const collector = doc.body.collector;
  const sectionBody = doc.body.sections
    ?.map((section) => `## ${section.title}\n\n${section.body}`)
    .join("\n\n");
  const body = doc.body.content?.trim() || sectionBody?.trim() || fallback?.body || "";
  if (!body) return null;

  return {
    ...fallback,
    id: doc.slug,
    type: resolveEntryType(collector?.category, fallback?.type),
    title: doc.title,
    summary: doc.body.excerpt?.trim() || doc.seo.description?.trim() || fallback?.summary,
    tags: collector?.tags?.length ? collector.tags : fallback?.tags,
    site_sections: resolveSectionId(collector?.category, fallback?.site_sections),
    province: collector?.province ?? fallback?.province,
    sources: collector?.sourceUrl
      ? [{ title: collector.sourceId || collector.source, url: collector.sourceUrl }]
      : fallback?.sources,
    status: "published",
    site_ready: true,
    confidence: fallback?.confidence ?? (collector && collector.qualityScore >= 80 ? "high" : "medium"),
    last_verified: doc.publishedAt?.slice(0, 10) ?? doc.updatedAt.slice(0, 10),
    seo_slug: doc.slug,
    body,
  };
}

export function mergeKnowledgeCatalog(
  fallbackEntries: KbEntry[],
  documents: CmsDocument[],
): KbEntry[] {
  const byId = new Map(fallbackEntries.map((entry) => [entry.id, entry]));

  for (const document of documents) {
    if (document.docType !== "knowledge" || !isCmsDocumentComplete(document)) continue;
    if (document.seo.noIndex) {
      byId.delete(document.slug);
      continue;
    }
    const entry = knowledgeEntryFromCms(document, byId.get(document.slug));
    if (entry) byId.set(entry.id, entry);
  }

  return [...byId.values()].sort((a, b) => a.title.localeCompare(b.title, "ru"));
}

/** Public KB catalog: generated baseline plus complete, indexable CMS publications. */
export async function resolveKnowledgeCatalog(locale = "ru"): Promise<KbEntry[]> {
  const fallback = getAllEntries();
  const supabase = await getCmsServerClient();
  if (!supabase) return fallback;
  const documents = await fetchPublishedCmsDocumentsMergedByLocaleChain(
    supabase,
    "knowledge",
    locale,
  );
  return mergeKnowledgeCatalog(fallback, documents);
}

/** Published CMS content overrides a generated KB entry and may add a new detail page. */
export async function resolveKnowledgeEntry(slug: string, locale = "ru"): Promise<KbEntry | null> {
  const fallback = getEntry(slug) ?? null;
  const supabase = await getCmsServerClient();
  const translationStatus = supabase
    ? await fetchCmsTranslationStatusForSlug(supabase, "knowledge", slug, {
        ruFallbackComplete: Boolean(fallback),
      })
    : buildDefaultTranslationStatus(Boolean(fallback));

  let resolvedSeo: CmsDocument["seo"] | undefined;
  const resolved = await resolveWithPublishedCmsOverride({
    docType: "knowledge",
    slug,
    locale,
    fallback,
    supabase,
    isUsable: isCmsDocumentComplete,
    merge: knowledgeEntryFromCms,
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

export async function listPublishedKnowledgeSlugs(locale = "ru"): Promise<string[]> {
  return listPublishedCmsSlugs("knowledge", getAllEntryIds(), locale);
}
