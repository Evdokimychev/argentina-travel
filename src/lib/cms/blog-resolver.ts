import { blogPosts, getBlogPostBySlug } from "@/data/blog";
import { sortBlogPostsByDate } from "@/lib/blog-utils";
import type { BlogPost } from "@/types";
import {
  cmsOverrideId,
  fetchPublishedCmsDocumentsByType,
  getCmsServerClient,
  resolveWithPublishedCmsOverride,
} from "@/lib/cms/content-resolver";
import {
  blogPostFromCms,
  type CmsDocument,
} from "@/types/cms-content";

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
  return fetchPublishedCmsDocumentsByType(supabase, "blog", locale);
}

/** CMS published posts override file posts by slug and can add CMS-only posts. */
export function mergeBlogCatalog(filePosts: BlogPost[], cmsPosts: CmsDocument[]): BlogPost[] {
  const mergedBySlug = new Map(filePosts.map((post) => [post.slug, post] as const));

  for (const cmsPost of cmsPosts) {
    if (cmsPost.body.kind !== "blog") continue;
    const fallback = mergedBySlug.get(cmsPost.slug);
    const merged = blogPostFromCms(cmsPost, fallback);
    if (merged) mergedBySlug.set(merged.slug, merged);
  }

  return sortBlogPostsByDate([...mergedBySlug.values()]);
}

/** Blog catalog for server components with CMS published overrides. */
export async function resolveBlogCatalog(locale = "ru"): Promise<BlogPost[]> {
  const fallback = sortBlogPostsByDate(blogPosts);
  const supabase = await getCmsServerClient();
  if (!supabase) return fallback;

  const cmsPosts = await fetchPublishedCmsDocumentsByType(supabase, "blog", locale);
  if (cmsPosts.length === 0) return fallback;

  return mergeBlogCatalog(blogPosts, cmsPosts);
}

/** Published CMS override merged with TS defaults for missing media/metadata. */
export async function resolveBlogPost(slug: string, locale = "ru"): Promise<BlogPost | undefined> {
  const fallback = getBlogPostBySlug(slug);

  const resolved = await resolveWithPublishedCmsOverride({
    docType: "blog",
    slug,
    locale,
    fallback: fallback ?? null,
    merge: (doc, fb) => blogPostFromCms(doc, fb),
  });

  return resolved ?? undefined;
}
