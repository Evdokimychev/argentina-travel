import type { ItemList, WithContext } from "schema-dts";
import { getBlogHubPosts, getPrimaryBlogHubForPost } from "@/data/blog-hubs";
import { filterIndexableBlogPosts } from "@/lib/blog-utils";
import { absoluteUrl } from "@/lib/site-url";
import { blogPostPath } from "@/lib/blog-slug-resolve";
import type { BlogPost } from "@/types";

export type BlogTopicClusterItem = {
  slug: string;
  title: string;
  href: string;
};

/** Соседние материалы в тематическом кластере (хабе). */
export function getBlogTopicClusterSiblings(
  post: BlogPost,
  catalog: BlogPost[],
  limit = 6,
  excludeSlug?: string,
): BlogTopicClusterItem[] {
  const hub = getPrimaryBlogHubForPost(post);
  if (!hub) return [];

  const siblings = getBlogHubPosts(hub, catalog)
    .filter((entry) => entry.slug !== (excludeSlug ?? post.slug))
    .slice(0, limit);

  return siblings.map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    href: blogPostPath(entry.slug),
  }));
}

export function buildBlogTopicClusterItemListJsonLd(
  post: BlogPost,
  catalog: BlogPost[],
): WithContext<ItemList> | null {
  const hub = getPrimaryBlogHubForPost(post);
  if (!hub) return null;

  const items = filterIndexableBlogPosts(getBlogHubPosts(hub, catalog)).slice(0, 12);
  if (items.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${hub.shortTitle} — тематический кластер`,
    description: hub.description,
    url: absoluteUrl(blogPostPath(post.slug)),
    numberOfItems: items.length,
    itemListElement: items.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Article",
        name: entry.title,
        url: absoluteUrl(blogPostPath(entry.slug)),
      },
    })),
  };
}
