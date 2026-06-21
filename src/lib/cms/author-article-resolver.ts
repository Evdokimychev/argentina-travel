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

export function authorArticleOverrideId(slug: string, locale = "ru"): string {
  return cmsOverrideId("author_article", slug, locale);
}

export async function resolveAuthorArticle(
  slug: string,
  locale = "ru"
): Promise<BlogPost | undefined> {
  const supabase = await getCmsServerClient();
  const translationStatus = supabase
    ? await fetchCmsTranslationStatusForSlug(supabase, "author_article", slug, {
        ruFallbackComplete: false,
      })
    : buildDefaultTranslationStatus(false);

  const resolved = await resolveWithPublishedCmsOverride<BlogPost>({
    docType: "author_article",
    slug,
    locale,
    fallback: null,
    merge: (doc) => authorArticleFromCms(doc) ?? null,
    supabase,
    isUsable: isCmsDocumentComplete,
  });

  if (!resolved) return undefined;
  return attachCmsResolverMetadata(resolved, buildCmsResolverMetadata(locale, translationStatus));
}

export async function listPublishedAuthorArticleSlugs(locale = "ru"): Promise<string[]> {
  const supabase = await getCmsServerClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("content_documents")
    .select("slug")
    .eq("doc_type", "author_article")
    .eq("locale", locale)
    .eq("status", "published");

  return (data ?? []).map((row) => row.slug);
}

export type { CmsDocument };
