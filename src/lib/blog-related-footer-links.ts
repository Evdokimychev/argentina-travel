import { BLOG_HUB_LINKS } from "@/data/blog-hub-links";
import type { BlogPost, BlogRelatedResource } from "@/types";

const SIDEBAR_HREFS = new Set(BLOG_HUB_LINKS.map((link) => link.href));

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
export function getBlogPostFooterLinks(post: BlogPost): BlogRelatedResource[] {
  const seen = new Set<string>();

  return (post.relatedResources ?? []).filter((resource) => {
    if (resource.type === "blog") return false;
    if (!isExternalSiteSection(resource)) return false;
    if (SIDEBAR_HREFS.has(resource.href)) return false;
    if (seen.has(resource.href)) return false;
    seen.add(resource.href);
    return true;
  });
}

export function getBlogPostSidebarRelatedResources(post: BlogPost): BlogRelatedResource[] {
  return (post.relatedResources ?? []).filter((resource) => resource.type === "blog");
}
