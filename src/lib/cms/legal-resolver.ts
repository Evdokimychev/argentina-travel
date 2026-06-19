import { LEGAL_DOCUMENTS } from "@/data/legal-content";
import type { LegalDocument } from "@/data/legal-content";
import {
  attachCmsResolverMetadata,
  buildCmsResolverMetadata,
  fetchCmsTranslationStatusForSlug,
  getCmsServerClient,
  cmsOverrideId,
  listPublishedCmsSlugs,
  resolveWithPublishedCmsOverride,
} from "@/lib/cms/content-resolver";
import { buildDefaultTranslationStatus, isCmsDocumentComplete } from "@/lib/cms/translation-status";
import {
  legalDocumentFromCms,
  type CmsDocType,
  type CmsDocument,
} from "@/types/cms-content";

export {
  fetchPublishedCmsDocument as fetchPublishedLegalOverride,
  fetchCmsOverrideMap,
} from "@/lib/cms/content-resolver";

export function legalOverrideId(slug: string, locale = "ru"): string {
  return cmsOverrideId("legal", slug, locale);
}

/** Published DB override takes precedence over TS file. */
export async function resolveLegalDocument(slug: string, locale = "ru"): Promise<LegalDocument | null> {
  const fallback = LEGAL_DOCUMENTS[slug] ?? null;
  const supabase = await getCmsServerClient();
  const translationStatus = supabase
    ? await fetchCmsTranslationStatusForSlug(supabase, "legal", slug, {
        ruFallbackComplete: Boolean(fallback),
      })
    : buildDefaultTranslationStatus(Boolean(fallback));

  const resolved = await resolveWithPublishedCmsOverride({
    docType: "legal",
    slug,
    locale,
    fallback,
    merge: (doc) => legalDocumentFromCms(doc),
    supabase,
    isUsable: isCmsDocumentComplete,
  });
  if (!resolved) return null;
  return attachCmsResolverMetadata(resolved, buildCmsResolverMetadata(locale, translationStatus));
}

export async function listPublishedLegalSlugs(locale = "ru"): Promise<string[]> {
  const fallbackSlugs = Object.keys(LEGAL_DOCUMENTS);
  return listPublishedCmsSlugs("legal", fallbackSlugs, locale);
}

export type { CmsDocType, CmsDocument };
