import type { SupabaseClient } from "@supabase/supabase-js";
import { rowToCmsDocument } from "@/lib/cms/content-mapper";
import {
  buildDefaultTranslationStatus,
  isCmsDocumentComplete,
  isPublishedTranslationComplete,
  toLocaleTranslationStatus,
  type CmsTranslationStatus,
} from "@/lib/cms/translation-status";
import { I18N_LOCALES, isI18nLocale, type I18nLocale } from "@/lib/i18n/config";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import { cmsDocumentId, type CmsDocType, type CmsDocument } from "@/types/cms-content";

export type CmsDbClient = SupabaseClient<Database>;

export type CmsResolverMetadata = {
  requestedLocale: I18nLocale;
  translationStatus: CmsTranslationStatus;
  showTranslationBanner: boolean;
};

export type CmsContentWithMetadata<T extends object> = T & {
  cmsMetadata: CmsResolverMetadata;
};

type ResolverLocaleStatusKey = keyof Pick<CmsTranslationStatus, "es_status" | "en_status">;

function normalizeRequestedLocale(locale: string): I18nLocale {
  return isI18nLocale(locale) ? locale : "ru";
}

function getRequestedLocaleStatus(
  locale: I18nLocale,
  translationStatus: CmsTranslationStatus
): boolean {
  if (locale === "ru") return translationStatus.ru_complete;
  const key = `${locale}_status` as ResolverLocaleStatusKey;
  return isPublishedTranslationComplete(translationStatus[key]);
}

export function buildCmsResolverMetadata(
  requestedLocale: string,
  translationStatus: CmsTranslationStatus
): CmsResolverMetadata {
  const locale = normalizeRequestedLocale(requestedLocale);
  return {
    requestedLocale: locale,
    translationStatus,
    showTranslationBanner: locale !== "ru" && !getRequestedLocaleStatus(locale, translationStatus),
  };
}

export function attachCmsResolverMetadata<T extends object>(
  value: T,
  metadata: CmsResolverMetadata
): CmsContentWithMetadata<T> {
  return { ...value, cmsMetadata: metadata };
}

export function getCmsResolverMetadata(value: unknown): CmsResolverMetadata | null {
  if (!value || typeof value !== "object" || !("cmsMetadata" in value)) return null;
  const metadata = (value as { cmsMetadata?: CmsResolverMetadata }).cmsMetadata;
  return metadata ?? null;
}

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

export async function fetchCmsTranslationStatusForSlug(
  supabase: CmsDbClient,
  docType: CmsDocType,
  slug: string,
  options?: { ruFallbackComplete?: boolean }
): Promise<CmsTranslationStatus> {
  const ids = I18N_LOCALES.map((locale) => cmsDocumentId(docType, slug, locale));
  const { data, error } = await supabase.from("content_documents").select("*").in("id", ids);
  if (error) {
    return buildDefaultTranslationStatus(options?.ruFallbackComplete ?? false);
  }

  const byLocale: Partial<Record<I18nLocale, CmsDocument>> = {};
  for (const row of data ?? []) {
    const mapped = rowToCmsDocument(row);
    if (isI18nLocale(mapped.locale)) {
      byLocale[mapped.locale] = mapped;
    }
  }

  return {
    ru_complete: byLocale.ru ? isCmsDocumentComplete(byLocale.ru) : (options?.ruFallbackComplete ?? false),
    es_status: toLocaleTranslationStatus(byLocale.es),
    en_status: toLocaleTranslationStatus(byLocale.en),
  };
}

/** Union of fallback slugs and published CMS slugs for a doc type. */
export async function listPublishedCmsSlugs(
  docType: CmsDocType,
  fallbackSlugs: string[],
  locale = "ru",
  options?: { cmsOnly?: boolean }
): Promise<string[]> {
  const supabase = await getCmsServerClient();
  if (!supabase) return options?.cmsOnly ? [] : fallbackSlugs;

  const { data } = await supabase
    .from("content_documents")
    .select("slug")
    .eq("doc_type", docType)
    .eq("locale", locale)
    .eq("status", "published");

  const cmsSlugs = (data ?? []).map((row) => row.slug);
  if (options?.cmsOnly) return Array.from(new Set(cmsSlugs));
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
  supabase?: CmsDbClient | null;
  isUsable?: (doc: CmsDocument) => boolean;
}): Promise<T | null> {
  const { docType, slug, locale = "ru", fallback, merge, isUsable } = options;
  const supabase = options.supabase === undefined ? await getCmsServerClient() : options.supabase;
  if (!supabase) return fallback;

  for (const tryLocale of cmsLocaleFallbackChain(locale)) {
    const override = await fetchPublishedCmsDocument(supabase, docType, slug, tryLocale);
    if (override) {
      if (isUsable && !isUsable(override)) continue;
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
