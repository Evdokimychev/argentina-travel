import type { BlogPost } from "@/types";
import type { BlogReadingHistoryEntry } from "@/lib/blog-reading-history";

function categoryWeights(history: BlogReadingHistoryEntry[]): Map<string, number> {
  const weights = new Map<string, number>();
  history.forEach((entry, index) => {
    if (!entry.category) return;
    const boost = Math.max(1, history.length - index);
    weights.set(entry.category, (weights.get(entry.category) ?? 0) + boost);
  });
  return weights;
}

/** Рекомендации по истории чтения (local-first, без серверной аналитики). */
export function getPersonalizedBlogPosts(
  catalog: BlogPost[],
  history: BlogReadingHistoryEntry[],
  limit = 4,
): BlogPost[] {
  if (history.length === 0 || catalog.length === 0) return [];

  const readSlugs = new Set(history.map((entry) => entry.slug));
  const weights = categoryWeights(history);
  const tagCounts = new Map<string, number>();

  for (const entry of history) {
    const post = catalog.find((item) => item.slug === entry.slug);
    if (!post) continue;
    for (const tag of post.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }

  const scored = catalog
    .filter((post) => !readSlugs.has(post.slug) && !post.noIndex)
    .map((post) => {
      let score = weights.get(post.category) ?? 0;
      for (const tag of post.tags) {
        score += (tagCounts.get(tag) ?? 0) * 2;
      }
      if (post.editorialReviewed) score += 3;
      if (post.richArticleId) score += 1;
      return { post, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date));

  if (scored.length >= limit) {
    return scored.slice(0, limit).map(({ post }) => post);
  }

  const fallback = catalog
    .filter((post) => !readSlugs.has(post.slug) && !post.noIndex)
    .sort((a, b) => b.date.localeCompare(a.date));

  const merged = [...scored.map(({ post }) => post)];
  for (const post of fallback) {
    if (merged.length >= limit) break;
    if (!merged.some((entry) => entry.slug === post.slug)) merged.push(post);
  }

  return merged.slice(0, limit);
}
