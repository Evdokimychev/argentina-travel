import {
  attachCmsResolverMetadata,
  buildCmsResolverMetadata,
  fetchPublishedCmsDocumentsMergedByLocaleChain,
  fetchCmsTranslationStatusForSlug,
  getCmsServerClient,
  resolveWithPublishedCmsOverride,
} from "@/lib/cms/content-resolver";
import { buildDefaultTranslationStatus, isCmsDocumentComplete } from "@/lib/cms/translation-status";
import { getAllEntries, getEntry, KB_SECTIONS } from "@/lib/knowledge-base/content";
import {
  getPublicationIssues,
  isPublicKbEntry,
  type PublicationIssue,
} from "@/lib/knowledge-base/publication-quality";
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

function normalizeBody(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function countWords(value: string): number {
  return value.match(/[\p{L}\p{N}]+(?:[-’'][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}

export type CmsKnowledgePublicationIssue =
  | PublicationIssue
  | "incomplete_document"
  | "missing_source_provenance"
  | "low_quality_score"
  | "collector_review_required"
  | "sensitive_claim_review_required";

export function knowledgeEntryFromCms(doc: CmsDocument, fallback?: KbEntry): KbEntry | null {
  if (doc.docType !== "knowledge" || doc.body.kind !== "blog") return null;
  const collector = doc.body.collector;
  const sectionBody = doc.body.sections
    ?.map((section) => `## ${section.title}\n\n${section.body}`)
    .join("\n\n");
  const body = doc.body.content?.trim() || sectionBody?.trim() || fallback?.body || "";
  if (!body) return null;
  const preservesFallbackBody = Boolean(
    fallback?.body && normalizeBody(body) === normalizeBody(fallback.body),
  );
  const collectorSource = collector?.sourceUrl
    ? [{
        id: collector.sourceId || collector.identity,
        title: collector.sourceId || collector.source,
        url: collector.sourceUrl,
      }]
    : undefined;
  const sources = preservesFallbackBody ? fallback?.sources : (collectorSource ?? fallback?.sources);
  const fallbackEditorial = fallback?.editorial;
  const sensitiveContentChanged = Boolean(fallbackEditorial?.sensitive && !preservesFallbackBody);
  const fallbackProvenance = fallbackEditorial?.provenance;

  return {
    ...fallback,
    id: doc.slug,
    type: resolveEntryType(collector?.category, fallback?.type),
    title: doc.title,
    summary: doc.body.excerpt?.trim() || doc.seo.description?.trim() || fallback?.summary,
    tags: collector?.tags?.length ? collector.tags : fallback?.tags,
    site_sections: resolveSectionId(collector?.category, fallback?.site_sections),
    province: collector?.province ?? fallback?.province,
    sources,
    status: "published",
    site_ready: true,
    confidence: fallback?.confidence ?? (collector && collector.qualityScore >= 80 ? "high" : "medium"),
    last_verified: doc.publishedAt?.slice(0, 10) ?? doc.updatedAt.slice(0, 10),
    seo_slug: doc.slug,
    editorial: {
      ...fallbackEditorial,
      word_count: countWords(body),
      source_count: sources?.length ?? 0,
      missing_sources: Boolean(fallbackEditorial?.sensitive && !sources?.length),
      provenance:
        sensitiveContentChanged && fallbackProvenance
          ? { ...fallbackProvenance, strict_ready: false }
          : fallbackProvenance,
    },
    body,
  };
}

export function getCmsKnowledgePublicationIssues(
  doc: CmsDocument,
  fallback: KbEntry | undefined = getEntry(doc.slug),
): CmsKnowledgePublicationIssue[] {
  if (doc.docType !== "knowledge") return [];
  const issues: CmsKnowledgePublicationIssue[] = [];
  if (!isCmsDocumentComplete(doc) || doc.body.kind !== "blog") {
    return ["incomplete_document"];
  }

  const entry = knowledgeEntryFromCms(doc, fallback);
  if (!entry) return ["incomplete_document"];
  issues.push(...getPublicationIssues(entry));

  const collector = doc.body.collector;
  const preservesFallbackBody = Boolean(
    fallback?.body && normalizeBody(entry.body) === normalizeBody(fallback.body),
  );
  const usesReviewedProjectSource = Boolean(
    preservesFallbackBody &&
      fallback &&
      isPublicKbEntry(fallback) &&
      collector?.source === "project-knowledge-base",
  );
  if (!usesReviewedProjectSource && !collector?.sourceUrl) {
    issues.push("missing_source_provenance");
  }
  if (!collector || collector.qualityScore < 80) {
    issues.push("low_quality_score");
  }
  if (collector?.flags.length) {
    issues.push("collector_review_required");
  }
  if (fallback?.editorial?.sensitive && !preservesFallbackBody) {
    issues.push("sensitive_claim_review_required");
  }

  return [...new Set(issues)];
}

export function isCmsKnowledgePublicDocument(
  doc: CmsDocument,
  fallback: KbEntry | undefined = getEntry(doc.slug),
): boolean {
  return (
    doc.docType === "knowledge" &&
    doc.status === "published" &&
    doc.seo.noIndex !== true &&
    getCmsKnowledgePublicationIssues(doc, fallback).length === 0
  );
}

const CMS_KNOWLEDGE_ISSUE_LABELS: Record<CmsKnowledgePublicationIssue, string> = {
  not_publication_ready: "материал не отмечен как готовый",
  mixed_script_word: "в тексте смешаны кириллица и латиница",
  non_russian_title: "заголовок не адаптирован на русский язык",
  non_russian_summary: "описание не адаптировано на русский язык",
  placeholder_content: "в тексте остались служебные заглушки",
  machine_translation_marker: "в тексте осталась пометка машинного перевода",
  internal_editorial_marker: "в тексте осталась внутренняя редакционная пометка",
  malformed_markdown_heading: "нарушена структура заголовков",
  missing_sensitive_source: "для чувствительного утверждения нет источника",
  sensitive_provenance_not_ready: "чувствительные утверждения не прошли проверку источников",
  thin_content: "основной текст короче 120 слов",
  missing_hero: "для географического материала не выбрано главное изображение",
  incomplete_document: "не заполнены заголовок или основной текст",
  missing_source_provenance: "не указан проверяемый первоисточник",
  low_quality_score: "редакционная оценка ниже 80 из 100",
  collector_review_required: "у материала остались замечания редактора",
  sensitive_claim_review_required: "изменён чувствительный материал без повторной проверки фактов",
};

export function describeCmsKnowledgePublicationIssues(
  issues: CmsKnowledgePublicationIssue[],
): string {
  return issues.map((issue) => CMS_KNOWLEDGE_ISSUE_LABELS[issue]).join("; ");
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
    const fallback = byId.get(document.slug);
    const entry = knowledgeEntryFromCms(document, fallback);
    if (entry && isCmsKnowledgePublicDocument(document, fallback)) byId.set(entry.id, entry);
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
    isUsable: (doc) => isCmsKnowledgePublicDocument(doc, fallback ?? undefined),
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
  const catalog = await resolveKnowledgeCatalog(locale);
  return catalog.map((entry) => entry.id);
}
