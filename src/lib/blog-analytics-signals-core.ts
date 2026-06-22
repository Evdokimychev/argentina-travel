import type { BlogReadingHistoryEntry } from "@/lib/blog-reading-history";
import { getPersonalizedBlogPosts } from "@/lib/blog-personalized";
import type { BlogPost } from "@/types";

export type BlogAnalyticsSignals = {
  categoryWeights: Map<string, number>;
  readSlugs: Set<string>;
  tagWeights: Map<string, number>;
  source: "local" | "server" | "merged";
};

/** Env-gated stub for future Metrika/GA4 import pipeline. */
export function isBlogAnalyticsImportEnabled(): boolean {
  return process.env.BLOG_ANALYTICS_IMPORT_ENABLED === "true";
}

export function mergeReadingHistorySignals(
  local: BlogReadingHistoryEntry[],
  remote: BlogReadingHistoryEntry[],
): BlogAnalyticsSignals {
  const mergedEntries = new Map<string, BlogReadingHistoryEntry>();

  for (const entry of [...remote, ...local]) {
    const existing = mergedEntries.get(entry.slug);
    if (!existing || entry.readAt > existing.readAt) {
      mergedEntries.set(entry.slug, entry);
    }
  }

  const history = [...mergedEntries.values()].sort((a, b) => b.readAt.localeCompare(a.readAt));
  const categoryWeights = new Map<string, number>();
  const readSlugs = new Set(history.map((entry) => entry.slug));

  history.forEach((entry, index) => {
    if (!entry.category) return;
    const boost = Math.max(1, history.length - index);
    categoryWeights.set(entry.category, (categoryWeights.get(entry.category) ?? 0) + boost);
  });

  return {
    categoryWeights,
    readSlugs,
    tagWeights: new Map(),
    source: remote.length > 0 ? "merged" : "local",
  };
}

export function scoreBlogPostsFromSignals(
  catalog: BlogPost[],
  signals: BlogAnalyticsSignals,
  limit = 4,
): BlogPost[] {
  const history: BlogReadingHistoryEntry[] = [...signals.readSlugs].map((slug) => {
    const post = catalog.find((entry) => entry.slug === slug);
    return {
      slug,
      title: post?.title ?? slug,
      category: post?.category,
      readAt: new Date().toISOString(),
    };
  });

  const personalized = getPersonalizedBlogPosts(catalog, history, limit);

  if (personalized.length >= limit || signals.categoryWeights.size === 0) {
    return personalized;
  }

  const scored = catalog
    .filter((post) => !signals.readSlugs.has(post.slug) && !post.noIndex)
    .map((post) => {
      let score = signals.categoryWeights.get(post.category) ?? 0;
      for (const tag of post.tags) {
        score += (signals.tagWeights.get(tag) ?? 0) * 2;
      }
      return { post, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date));

  const merged = [...personalized];
  for (const { post } of scored) {
    if (merged.length >= limit) break;
    if (!merged.some((entry) => entry.slug === post.slug)) merged.push(post);
  }

  return merged.slice(0, limit);
}
