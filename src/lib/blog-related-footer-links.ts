import { BLOG_HUB_LINKS } from "@/data/blog-hub-links";
import { getBlogPostBySlug } from "@/data/blog";
import { GUIDE_TOPICS } from "@/data/guide-topics";
import { getPlaceBySlug } from "@/data/places-seed";
import { getContentPage } from "@/lib/content-pages";
import { getDestinationBySlug } from "@/lib/destinations";
import { isBlogSlugPublished } from "@/lib/blog-slug-resolve";
import type { BlogPost, BlogRelatedResource } from "@/types";

const SIDEBAR_HREFS = new Set(BLOG_HUB_LINKS.map((link) => link.href));

function extractPathSlug(href: string, prefix: string): string | null {
  if (!href.startsWith(prefix)) return null;
  const slug = href.slice(prefix.length).split(/[?#]/)[0]?.replace(/\/$/, "");
  return slug || null;
}

export function isValidBlogRelatedResourceHref(
  resource: BlogRelatedResource,
  publishedBlogSlugs?: ReadonlySet<string>,
): boolean {
  if (resource.type === "blog") {
    const slug = extractPathSlug(resource.href, "/blog/");
    if (!slug) return false;
    if (publishedBlogSlugs) {
      return isBlogSlugPublished(slug, publishedBlogSlugs);
    }
    return Boolean(getBlogPostBySlug(slug));
  }

  if (resource.type === "guide") {
    const slug = extractPathSlug(resource.href, "/guide/");
    return slug ? slug in GUIDE_TOPICS : false;
  }

  if (resource.type === "immigration") {
    const slug = extractPathSlug(resource.href, "/immigration/");
    return slug ? Boolean(getContentPage("immigration", slug)) : false;
  }

  if (resource.type === "tour") {
    return resource.href === "/tours" || resource.href.startsWith("/tours?");
  }

  const destinationSlug = extractPathSlug(resource.href, "/destinations/");
  if (destinationSlug) {
    return Boolean(getDestinationBySlug(destinationSlug));
  }

  const placeSlug = extractPathSlug(resource.href, "/places/");
  if (placeSlug) {
    return Boolean(getPlaceBySlug(placeSlug));
  }

  return false;
}

function filterValidResources(
  resources: BlogRelatedResource[],
  publishedBlogSlugs?: ReadonlySet<string>,
): BlogRelatedResource[] {
  return resources.filter((resource) =>
    isValidBlogRelatedResourceHref(resource, publishedBlogSlugs),
  );
}

function isExternalSiteSection(resource: BlogRelatedResource): boolean {
  return (
    resource.type === "guide" ||
    resource.type === "immigration" ||
    resource.type === "tour" ||
    resource.href.startsWith("/places/") ||
    resource.href.startsWith("/destinations/") ||
    resource.href.startsWith("/collections/") ||
    resource.href.startsWith("/itineraries/")
  );
}

/** Компактные ссылки guide/places для подвала статьи — без дублей боковой панели и блог-карточек */
export function getBlogPostFooterLinks(
  post: BlogPost,
  publishedBlogSlugs?: ReadonlySet<string>,
): BlogRelatedResource[] {
  const seen = new Set<string>();

  return filterValidResources(post.relatedResources ?? [], publishedBlogSlugs).filter((resource) => {
    if (resource.type === "blog") return false;
    if (!isExternalSiteSection(resource)) return false;
    if (SIDEBAR_HREFS.has(resource.href)) return false;
    if (seen.has(resource.href)) return false;
    seen.add(resource.href);
    return true;
  });
}

export function getBlogPostSidebarRelatedResources(
  post: BlogPost,
  publishedBlogSlugs?: ReadonlySet<string>,
): BlogRelatedResource[] {
  return filterValidResources(post.relatedResources ?? [], publishedBlogSlugs).filter(
    (resource) => resource.type === "blog",
  );
}
