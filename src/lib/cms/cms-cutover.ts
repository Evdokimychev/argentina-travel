import { blogPosts } from "@/data/blog";
import { sortBlogPostsByDate } from "@/lib/blog-utils";
import { getPagesBySection } from "@/lib/content-pages";
import { fetchSiteFeatures } from "@/lib/site-settings-server";
import type { BlogPost } from "@/types";
import type { ContentPage } from "@/types/content-page";
import {
  fetchPublishedCmsDocumentsMergedByLocaleChain,
  getCmsServerClient,
} from "@/lib/cms/content-resolver";
import { isCmsDocumentComplete } from "@/lib/cms/translation-status";
import {
  blogPostFromCms,
  guidePageFromCms,
  type CmsDocType,
  type CmsDocument,
} from "@/types/cms-content";

export type CmsCutoverFlags = {
  blog: boolean;
  guide: boolean;
};

export type CmsCutoverReadiness = {
  blog: {
    tsCount: number;
    cmsPublished: number;
    cutover: boolean;
    ready: boolean;
  };
  guide: {
    tsCount: number;
    cmsPublished: number;
    cutover: boolean;
    ready: boolean;
  };
};

export async function getCmsCutoverFlags(): Promise<CmsCutoverFlags> {
  const features = await fetchSiteFeatures();
  return {
    blog: features.cmsBlogCutover === true,
    guide: features.cmsGuideCutover === true,
  };
}

export function blogPostsFromCmsDocuments(docs: CmsDocument[]): BlogPost[] {
  const posts: BlogPost[] = [];
  for (const doc of docs) {
    if (doc.body.kind !== "blog" || !isCmsDocumentComplete(doc)) continue;
    const post = blogPostFromCms(doc);
    if (post) posts.push(post);
  }
  return sortBlogPostsByDate(posts);
}

export function guidePagesFromCmsDocuments(
  docs: CmsDocument[],
  orderSlugs?: string[]
): ContentPage[] {
  const mergedBySlug = new Map<string, ContentPage>();

  for (const doc of docs) {
    if (doc.body.kind !== "guide" || !isCmsDocumentComplete(doc)) continue;
    const page = guidePageFromCms(doc);
    if (page) mergedBySlug.set(page.slug, page);
  }

  if (orderSlugs?.length) {
    const sourceSet = new Set(orderSlugs);
    const ordered = orderSlugs
      .map((slug) => mergedBySlug.get(slug))
      .filter((page): page is ContentPage => Boolean(page));
    const cmsOnly = [...mergedBySlug.values()]
      .filter((page) => !sourceSet.has(page.slug))
      .sort((a, b) => a.title.localeCompare(b.title, "ru"));
    return [...ordered, ...cmsOnly];
  }

  return [...mergedBySlug.values()].sort((a, b) => a.title.localeCompare(b.title, "ru"));
}

async function countPublishedCms(docType: CmsDocType): Promise<number> {
  const supabase = await getCmsServerClient();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("content_documents")
    .select("id", { count: "exact", head: true })
    .eq("doc_type", docType)
    .eq("locale", "ru")
    .eq("status", "published");

  if (error) return 0;
  return count ?? 0;
}

export async function fetchCmsCutoverReadiness(): Promise<CmsCutoverReadiness> {
  const flags = await getCmsCutoverFlags();
  const [blogCms, guideCms] = await Promise.all([
    countPublishedCms("blog"),
    countPublishedCms("guide"),
  ]);

  const blogTs = blogPosts.length;
  const guideTs = getPagesBySection("guide").length;

  return {
    blog: {
      tsCount: blogTs,
      cmsPublished: blogCms,
      cutover: flags.blog,
      ready: !flags.blog || blogCms > 0,
    },
    guide: {
      tsCount: guideTs,
      cmsPublished: guideCms,
      cutover: flags.guide,
      ready: !flags.guide || guideCms > 0,
    },
  };
}

export async function fetchPublishedCmsDocumentsForCutover(
  docType: Extract<CmsDocType, "blog" | "guide">,
  locale = "ru"
): Promise<CmsDocument[]> {
  const supabase = await getCmsServerClient();
  if (!supabase) return [];
  return fetchPublishedCmsDocumentsMergedByLocaleChain(supabase, docType, locale);
}
