import type { KnowledgeLinksBundle } from "@/lib/knowledge-internal-links";
import type { RelatedContentItem } from "@/types/content-reading";
import type { ContentRelatedLink } from "@/types/content-page";
import type { BlogRelatedResource } from "@/types";

export function mapContentRelatedLinks(links: ContentRelatedLink[]): RelatedContentItem[] {
  return links.map((link) => ({
    title: link.label,
    href: link.href,
    description: link.description,
    kind: inferKindFromHref(link.href),
  }));
}

export function mapBlogRelatedResources(resources: BlogRelatedResource[]): RelatedContentItem[] {
  return resources.map((resource) => ({
    title: resource.label,
    href: resource.href,
    description: resource.description,
    kind: resource.type === "blog" ? "blog" : resource.type === "tour" ? "tour" : "guide",
  }));
}

export function flattenKnowledgeLinks(links: KnowledgeLinksBundle): RelatedContentItem[] {
  return [
    ...links.destinations.map((item) => ({ ...item, kind: "destination" as const })),
    ...links.places.map((item) => ({ ...item, kind: "place" as const })),
    ...links.guides.map((item) => ({ ...item, kind: "guide" as const })),
    ...links.blog.map((item) => ({ ...item, kind: "blog" as const })),
    ...links.collections.map((item) => ({ ...item, kind: "collection" as const })),
    ...links.itineraries.map((item) => ({ ...item, kind: "itinerary" as const })),
  ].map(({ title, href, kind }) => ({ title, href, kind }));
}

function inferKindFromHref(href: string): RelatedContentItem["kind"] {
  if (href.startsWith("/blog/")) return "blog";
  if (href.startsWith("/guide/")) return "guide";
  if (href.startsWith("/destinations/")) return "destination";
  if (href.startsWith("/places/")) return "place";
  if (href.startsWith("/tours")) return "tour";
  return "link";
}
