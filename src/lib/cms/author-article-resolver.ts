import {
  attachCmsResolverMetadata,
  buildCmsResolverMetadata,
  cmsOverrideId,
  fetchCmsTranslationStatusForSlug,
  getCmsServerClient,
  resolveWithPublishedCmsOverride,
} from "@/lib/cms/content-resolver";
import { buildDefaultTranslationStatus, isCmsDocumentComplete } from "@/lib/cms/translation-status";
import { authorArticleFromCms, type CmsDocument } from "@/types/cms-content";
import type { BlogPost } from "@/types";
import {
  CmsPublicContentUnavailableError,
  cmsPublicUnavailable,
} from "@/lib/cms/public-read-result";

export function authorArticleOverrideId(slug: string, locale = "ru"): string {
  return cmsOverrideId("author_article", slug, locale);
}

export async function resolveAuthorArticle(
  slug: string,
  locale = "ru"
): Promise<BlogPost | undefined> {
  const supabase = await getCmsServerClient();
  const translationStatusPromise = supabase
    ? fetchCmsTranslationStatusForSlug(supabase, "author_article", slug, {
        ruFallbackComplete: false,
      })
    : Promise.resolve(buildDefaultTranslationStatus(false));

  let resolvedSeo: CmsDocument["seo"] | undefined;
  const [translationStatus, resolved] = await Promise.all([
    translationStatusPromise,
    resolveWithPublishedCmsOverride<BlogPost>({
      docType: "author_article",
      slug,
      locale,
      fallback: null,
      merge: (doc) => authorArticleFromCms(doc) ?? null,
      supabase,
      isUsable: isCmsDocumentComplete,
      onResolvedDocument: (doc) => {
        resolvedSeo = doc.seo;
      },
    }),
  ]);

  if (!resolved) return undefined;
  return attachCmsResolverMetadata(
    resolved,
    buildCmsResolverMetadata(locale, translationStatus, resolvedSeo),
  );
}

export async function listPublishedAuthorArticleSlugs(locale = "ru"): Promise<string[]> {
  const supabase = await getCmsServerClient();
  if (!supabase) throw new CmsPublicContentUnavailableError("db_unavailable");

  const { data, error } = await supabase
    .from("content_documents")
    .select("slug, seo")
    .eq("doc_type", "author_article")
    .eq("locale", locale)
    .eq("status", "published")
    .abortSignal(AbortSignal.timeout(1_500))
    .retry(false);

  if (error || !Array.isArray(data)) {
    const result = cmsPublicUnavailable(
      error ?? new Error("cms_public_malformed_author_slug_list"),
    );
    throw new CmsPublicContentUnavailableError(result.errorClass);
  }

  return data
    .filter((row) => {
      const seo = row.seo;
      return !(seo && typeof seo === "object" && !Array.isArray(seo) && seo.noIndex === true);
    })
    .map((row) => row.slug);
}

export type { CmsDocument };
