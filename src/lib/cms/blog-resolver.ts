import { blogPosts, getBlogPostBySlug } from "@/data/blog";
import { sortBlogPostsByDate } from "@/lib/blog-utils";
import {
  blogPostsFromCmsDocuments,
  fetchPublishedCmsDocumentsForCutover,
  getCmsCutoverFlags,
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
  blogPostFromCms,
  type CmsDocument,
} from "@/types/cms-content";
import type { BlogPost } from "@/types";

export {
  fetchPublishedCmsDocument as fetchPublishedBlogOverride,
} from "@/lib/cms/content-resolver";

export function blogOverrideId(slug: string, locale = "ru"): string {
  return cmsOverrideId("blog", slug, locale);
}

/** Returns all published CMS blog documents for a locale. */
export async function fetchPublishedBlogPostsFromCms(locale = "ru"): Promise<CmsDocument[]> {
  const supabase = await getCmsServerClient();
  if (!supabase) return [];
  return fetchPublishedCmsDocumentsMergedByLocaleChain(supabase, "blog", locale);
}

/** CMS published posts override file posts by slug and can add CMS-only posts. */
export function mergeBlogCatalog(filePosts: BlogPost[], cmsPosts: CmsDocument[]): BlogPost[] {
  const mergedBySlug = new Map(filePosts.map((post) => [post.slug, post] as const));

  for (const cmsPost of cmsPosts) {
    if (cmsPost.body.kind !== "blog" || !isCmsDocumentComplete(cmsPost)) continue;
    const fallback = mergedBySlug.get(cmsPost.slug);
    const merged = blogPostFromCms(cmsPost, fallback);
    if (merged) mergedBySlug.set(merged.slug, merged);
  }

  return sortBlogPostsByDate([...mergedBySlug.values()]);
}

/** Blog catalog for server components with CMS published overrides. */
export async function resolveBlogCatalog(locale = "ru"): Promise<BlogPost[]> {
  const cutover = await getCmsCutoverFlags();
  const supabase = await getCmsServerClient();

  if (cutover.blog) {
    if (!supabase) return [];
    const cmsPosts = await fetchPublishedCmsDocumentsForCutover("blog", locale);
    return blogPostsFromCmsDocuments(cmsPosts);
  }

  const fallback = sortBlogPostsByDate(blogPosts);
  if (!supabase) return fallback;

  const cmsPosts = await fetchPublishedCmsDocumentsMergedByLocaleChain(supabase, "blog", locale);
  if (cmsPosts.length === 0) return fallback;

  return mergeBlogCatalog(blogPosts, cmsPosts);
}

/** Published CMS override merged with TS defaults for missing media/metadata. */
export async function resolveBlogPost(slug: string, locale = "ru"): Promise<BlogPost | undefined> {
  const cutover = await getCmsCutoverFlags();
  const fallback = cutover.blog ? null : (getBlogPostBySlug(slug) ?? null);
  const supabase = await getCmsServerClient();
  const translationStatus = supabase
    ? await fetchCmsTranslationStatusForSlug(supabase, "blog", slug, {
        ruFallbackComplete: cutover.blog ? false : Boolean(fallback),
      })
    : buildDefaultTranslationStatus(cutover.blog ? false : Boolean(fallback));

  const resolved = await resolveWithPublishedCmsOverride({
    docType: "blog",
    slug,
    locale,
    fallback,
    merge: (doc, fb) => blogPostFromCms(doc, fb),
    supabase,
    isUsable: isCmsDocumentComplete,
  });

  if (!resolved) return undefined;
  return attachCmsResolverMetadata(resolved, buildCmsResolverMetadata(locale, translationStatus));
}

export async function listPublishedBlogSlugs(locale = "ru"): Promise<string[]> {
  const cutover = await getCmsCutoverFlags();
  const fallbackSlugs = blogPosts.map((post) => post.slug);
  return listPublishedCmsSlugs("blog", fallbackSlugs, locale, { cmsOnly: cutover.blog });
}
