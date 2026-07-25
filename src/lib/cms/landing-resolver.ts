import {
  attachCmsResolverMetadata,
  buildCmsResolverMetadata,
  cmsOverrideId,
  fetchCmsTranslationStatusForSlug,
  getCmsServerClient,
  listPublishedCmsSlugs,
  resolveWithPublishedCmsOverride,
} from "@/lib/cms/content-resolver";
import { buildDefaultTranslationStatus, isCmsDocumentComplete } from "@/lib/cms/translation-status";
import { landingPageFromCms, type CmsDocument } from "@/types/cms-content";
import type { ContentPage } from "@/types/content-page";

export function landingOverrideId(slug: string, locale = "ru"): string {
  return cmsOverrideId("landing", slug, locale);
}

/** Published landing pages are CMS-only (no TypeScript catalog fallback). */
export async function resolveLandingPage(
  slug: string,
  locale = "ru",
): Promise<ContentPage | null> {
  const supabase = await getCmsServerClient();
  const translationStatusPromise = supabase
    ? fetchCmsTranslationStatusForSlug(supabase, "landing", slug, {
        ruFallbackComplete: false,
      })
    : Promise.resolve(buildDefaultTranslationStatus(false));

  let resolvedSeo: CmsDocument["seo"] | undefined;
  const [translationStatus, resolved] = await Promise.all([
    translationStatusPromise,
    resolveWithPublishedCmsOverride({
      docType: "landing",
      slug,
      locale,
      fallback: null,
      merge: (doc) => landingPageFromCms(doc),
      supabase,
      isUsable: isCmsDocumentComplete,
      onResolvedDocument: (doc) => {
        resolvedSeo = doc.seo;
      },
    }),
  ]);
  if (!resolved) return null;
  return attachCmsResolverMetadata(
    resolved,
    buildCmsResolverMetadata(locale, translationStatus, resolvedSeo),
  );
}

export async function listPublishedLandingSlugs(locale = "ru"): Promise<string[]> {
  return listPublishedCmsSlugs("landing", [], locale, { cmsOnly: true });
}
