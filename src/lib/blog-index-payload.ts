import { BLOG_START_HERE_SLUGS } from "@/data/blog-canonical-map";
import type { BlogPost } from "@/types";

const BLOG_SEARCH_CONTENT_LIMIT = 400;

/**
 * Public blog index DTO. It intentionally keeps the BlogPost shape so existing
 * cards and filter helpers stay reusable, while excluding article bodies,
 * sections, embeds and cross-link collections from the RSC client payload.
 */
export function toBlogIndexPost(post: BlogPost): BlogPost {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content.slice(0, BLOG_SEARCH_CONTENT_LIMIT),
    author: post.author,
    authorBio: post.authorBio,
    authorAvatar: post.authorAvatar,
    date: post.date,
    dateModified: post.dateModified,
    image: post.image,
    category: post.category,
    readTime: post.readTime,
    readTimeMinutes: post.readTimeMinutes,
    tags: post.tags,
    featured: post.featured,
    cardVariant: post.cardVariant,
    editorialReviewed: post.editorialReviewed,
    noIndex: post.noIndex,
    richArticleId: post.richArticleId,
  };
}

export function toBlogIndexCatalog(posts: BlogPost[]): BlogPost[] {
  return posts.map(toBlogIndexPost);
}

export function getBlogStartHerePostsFromCatalog(catalog: BlogPost[]): BlogPost[] {
  const bySlug = new Map(catalog.map((post) => [post.slug, post]));
  return BLOG_START_HERE_SLUGS.map((slug) => bySlug.get(slug)).filter(
    (post): post is BlogPost => Boolean(post),
  );
}

export function hydrateBlogIndexPosts(
  catalog: BlogPost[],
  slugs: readonly string[],
  limit = slugs.length,
): BlogPost[] {
  const bySlug = new Map(catalog.map((post) => [post.slug, post]));
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((post): post is BlogPost => Boolean(post))
    .slice(0, limit);
}
