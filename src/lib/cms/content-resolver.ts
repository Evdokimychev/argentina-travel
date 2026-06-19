import type { SupabaseClient } from "@supabase/supabase-js";
import { rowToCmsDocument } from "@/lib/cms/content-mapper";
import { I18N_LOCALES, isI18nLocale, type I18nLocale } from "@/lib/i18n/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import { cmsDocumentId, type CmsDocType, type CmsDocument } from "@/types/cms-content";

export type CmsDbClient = SupabaseClient<Database>;

/** Admin/service-role client; null when Supabase is not configured. */
export async function getCmsServerClient(): Promise<CmsDbClient | null> {
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

export async function fetchPublishedCmsDocument(
  supabase: CmsDbClient,
  docType: CmsDocType,
  slug: string,
  locale = "ru"
): Promise<CmsDocument | null> {
  const id = cmsDocumentId(docType, slug, locale);
  const { data, error } = await supabase
    .from("content_documents")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return rowToCmsDocument(data);
}

export async function fetchPublishedCmsDocumentsByType(
  supabase: CmsDbClient,
  docType: CmsDocType,
  locale = "ru"
): Promise<CmsDocument[]> {
  const { data, error } = await supabase
    .from("content_documents")
    .select("*")
    .eq("doc_type", docType)
    .eq("locale", locale)
    .eq("status", "published");

  if (error || !data) return [];
  return data.map(rowToCmsDocument);
}

/**
 * Published CMS documents merged across locale fallback chain (ru → requested).
 * Per slug, the requested locale wins over Russian when both exist.
 */
export async function fetchPublishedCmsDocumentsMergedByLocaleChain(
  supabase: CmsDbClient,
  docType: CmsDocType,
  locale = "ru"
): Promise<CmsDocument[]> {
  const bySlug = new Map<string, CmsDocument>();
  const chain = [...cmsLocaleFallbackChain(locale)].reverse();

  for (const tryLocale of chain) {
    const docs = await fetchPublishedCmsDocumentsByType(supabase, docType, tryLocale);
    for (const doc of docs) {
      bySlug.set(doc.slug, doc);
    }
  }

  return [...bySlug.values()];
}

/** Published CMS slug per locale for hreflang (same logical document, locale-specific slug). */
export async function resolvePublishedCmsLocaleSlugs(
  docType: CmsDocType,
  slug: string
): Promise<Partial<Record<I18nLocale, string>>> {
  const supabase = await getCmsServerClient();
  if (!supabase) return { ru: slug };

  const slugs: Partial<Record<I18nLocale, string>> = {};

  for (const locale of I18N_LOCALES) {
    const doc = await fetchPublishedCmsDocument(supabase, docType, slug, locale);
    if (doc) {
      slugs[locale] = doc.slug;
    }
  }

  if (!slugs.ru) slugs.ru = slug;
  return slugs;
}

/** Locales with any CMS row (any status) for admin coverage. */
export async function fetchCmsLocalesForSlug(
  supabase: CmsDbClient,
  docType: CmsDocType,
  slug: string
): Promise<Partial<Record<I18nLocale, CmsDocument>>> {
  const result: Partial<Record<I18nLocale, CmsDocument>> = {};

  for (const locale of I18N_LOCALES) {
    const id = cmsDocumentId(docType, slug, locale);
    const { data } = await supabase.from("content_documents").select("*").eq("id", id).maybeSingle();
    if (data && isI18nLocale(data.locale)) {
      result[data.locale] = rowToCmsDocument(data);
    }
  }

  return result;
}

/** Union of fallback slugs and published CMS slugs for a doc type. */
export async function listPublishedCmsSlugs(
  docType: CmsDocType,
  fallbackSlugs: string[],
  locale = "ru"
): Promise<string[]> {
  const supabase = await getCmsServerClient();
  if (!supabase) return fallbackSlugs;

  const { data } = await supabase
    .from("content_documents")
    .select("slug")
    .eq("doc_type", docType)
    .eq("locale", locale)
    .eq("status", "published");

  const cmsSlugs = new Set((data ?? []).map((row) => row.slug));
  return Array.from(new Set([...fallbackSlugs, ...cmsSlugs]));
}

/**
 * DB-first resolution: published CMS document merged with TS/static fallback.
 * Returns fallback unchanged when Supabase is unavailable or no published override exists.
 */
/** Locales to try when resolving published CMS content: requested → ru. */
export function cmsLocaleFallbackChain(locale: string): string[] {
  if (locale === "ru") return ["ru"];
  return [locale, "ru"];
}

export async function resolveWithPublishedCmsOverride<T>(options: {
  docType: CmsDocType;
  slug: string;
  locale?: string;
  fallback: T | null;
  merge: (doc: CmsDocument, fallback: T | undefined) => T | null;
}): Promise<T | null> {
  const { docType, slug, locale = "ru", fallback, merge } = options;
  const supabase = await getCmsServerClient();
  if (!supabase) return fallback;

  for (const tryLocale of cmsLocaleFallbackChain(locale)) {
    const override = await fetchPublishedCmsDocument(supabase, docType, slug, tryLocale);
    if (override) {
      return merge(override, fallback ?? undefined) ?? fallback;
    }
  }

  return fallback;
}

/** All CMS documents (any status) keyed by id — used in admin inventory. */
export async function fetchCmsOverrideMap(
  supabase: CmsDbClient,
  docType?: CmsDocType
): Promise<Map<string, CmsDocument>> {
  let query = supabase.from("content_documents").select("*");
  if (docType) query = query.eq("doc_type", docType);

  const { data } = await query;
  const map = new Map<string, CmsDocument>();
  for (const row of data ?? []) {
    map.set(row.id, rowToCmsDocument(row));
  }
  return map;
}

export function cmsOverrideId(docType: CmsDocType, slug: string, locale = "ru"): string {
  return cmsDocumentId(docType, slug, locale);
}
