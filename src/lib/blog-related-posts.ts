import { getBlogHubsForPost, postMatchesBlogHub } from "@/data/blog-hubs";
import { filterIndexableBlogPosts } from "@/lib/blog-utils";
import type { BlogPost } from "@/types";

const SHARED_HUB_SCORE = 10;
const RELATED_RESOURCE_SCORE = 8;
const CATEGORY_MATCH_SCORE = 3;
const CATEGORY_ONLY_PENALTY = 2;
const RICH_PAIR_SCORE = 1;

function tagOverlapScore(a: BlogPost, b: BlogPost): number {
  const tagsB = new Set(b.tags);
  return a.tags.reduce((sum, tag) => sum + (tagsB.has(tag) ? 1 : 0), 0);
}

function extractBlogSlugFromHref(href: string): string | null {
  const match = href.match(/^\/blog\/([^/?#]+)$/);
  return match?.[1] ?? null;
}

function getExplicitRelatedSlugs(post: BlogPost): Set<string> {
  const slugs = new Set<string>();
  for (const resource of post.relatedResources ?? []) {
    const slug = extractBlogSlugFromHref(resource.href);
    if (slug) slugs.add(slug);
  }
  return slugs;
}

function sharesHub(a: BlogPost, b: BlogPost): boolean {
  return getBlogHubsForPost(a).some((hub) => postMatchesBlogHub(b, hub));
}

function isExplicitlyRelated(source: BlogPost, candidate: BlogPost): boolean {
  const slugs = getExplicitRelatedSlugs(source);
  if (slugs.has(candidate.slug)) return true;

  for (const resource of candidate.relatedResources ?? []) {
    const slug = extractBlogSlugFromHref(resource.href);
    if (slug === source.slug) return true;
  }

  return false;
}

/** 3–4 indexable-статьи по хабу, relatedResources, категории и тегам */
export function getRelatedBlogPosts(
  post: BlogPost,
  posts: BlogPost[],
  limit = 4,
): BlogPost[] {
  const candidates = filterIndexableBlogPosts(posts).filter((p) => p.slug !== post.slug);
  if (candidates.length === 0) return [];

  const scored = candidates.map((candidate) => {
    const tagScore = tagOverlapScore(post, candidate);
    let score = tagScore;

    if (candidate.category === post.category) {
      score += CATEGORY_MATCH_SCORE;
      if (tagScore === 0) score -= CATEGORY_ONLY_PENALTY;
    }

    if (sharesHub(post, candidate)) score += SHARED_HUB_SCORE;
    if (isExplicitlyRelated(post, candidate)) score += RELATED_RESOURCE_SCORE;
    if (candidate.richArticleId && post.richArticleId) score += RICH_PAIR_SCORE;

    return { candidate, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.candidate.date).getTime() - new Date(a.candidate.date).getTime();
  });

  const withScore = scored.filter(({ score }) => score > 0).map(({ candidate }) => candidate);
  if (withScore.length >= limit) return withScore.slice(0, limit);

  const fallback = scored.map(({ candidate }) => candidate);
  const seen = new Set(withScore.map((p) => p.slug));
  for (const item of fallback) {
    if (withScore.length >= limit) break;
    if (!seen.has(item.slug)) {
      withScore.push(item);
      seen.add(item.slug);
    }
  }

  return withScore.slice(0, limit);
}
