import type { SupabaseClient } from "@supabase/supabase-js";
import { blogPosts, getBlogPostBySlug } from "@/data/blog";
import { rowToCmsDocument } from "@/lib/cms/content-mapper";
import { sortBlogPostsByDate } from "@/lib/blog-utils";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import type { BlogPost } from "@/types";
import {
  blogPostFromCms,
  cmsDocumentId,
  type CmsDocument,
} from "@/types/cms-content";

type DbClient = SupabaseClient<Database>;

async function getServerClient(): Promise<DbClient | null> {
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

export async function fetchPublishedBlogOverride(
  supabase: DbClient,
  slug: string,
  locale = "ru"
): Promise<CmsDocument | null> {
  const id = cmsDocumentId("blog", slug, locale);
  const { data, error } = await supabase
    .from("content_documents")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return rowToCmsDocument(data);
}

async function fetchPublishedBlogPostsFromCmsWithClient(
  supabase: DbClient,
  locale = "ru"
): Promise<CmsDocument[]> {
  const { data, error } = await supabase
    .from("content_documents")
    .select("*")
    .eq("doc_type", "blog")
    .eq("locale", locale)
    .eq("status", "published");

  if (error || !data) return [];
  return data.map(rowToCmsDocument).filter((doc) => doc.body.kind === "blog");
}

/** Returns all published CMS blog documents for a locale. */
export async function fetchPublishedBlogPostsFromCms(locale = "ru"): Promise<CmsDocument[]> {
  const supabase = await getServerClient();
  if (!supabase) return [];
  return fetchPublishedBlogPostsFromCmsWithClient(supabase, locale);
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
  const supabase = await getServerClient();
  if (!supabase) return fallback;

  const cmsPosts = await fetchPublishedBlogPostsFromCmsWithClient(supabase, locale);
  if (cmsPosts.length === 0) return fallback;

  return mergeBlogCatalog(blogPosts, cmsPosts);
}

/** Published CMS override merged with TS defaults for missing media/metadata. */
export async function resolveBlogPost(slug: string, locale = "ru"): Promise<BlogPost | undefined> {
  const fallback = getBlogPostBySlug(slug);
  const supabase = await getServerClient();
  if (!supabase) return fallback;

  const override = await fetchPublishedBlogOverride(supabase, slug, locale);
  if (!override) return fallback;

  return blogPostFromCms(override, fallback) ?? fallback;
}

export function blogOverrideId(slug: string, locale = "ru"): string {
  return cmsDocumentId("blog", slug, locale);
}
