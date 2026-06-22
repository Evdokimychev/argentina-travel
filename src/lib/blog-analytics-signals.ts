import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { BlogReadingHistoryEntry } from "@/lib/blog-reading-history";
import { getPersonalizedBlogPosts } from "@/lib/blog-personalized";
import {
  isBlogAnalyticsImportEnabled,
  mergeReadingHistorySignals,
  scoreBlogPostsFromSignals,
  type BlogAnalyticsSignals,
} from "@/lib/blog-analytics-signals-core";
import type { BlogPost } from "@/types";

export type { BlogAnalyticsSignals };
export { isBlogAnalyticsImportEnabled, mergeReadingHistorySignals, scoreBlogPostsFromSignals };

type DbClient = SupabaseClient<Database>;

export async function loadServerBlogCategoryWeights(
  supabase: DbClient,
  userId: string,
): Promise<Map<string, number>> {
  const weights = new Map<string, number>();

  if (!isBlogAnalyticsImportEnabled()) {
    const { data } = await supabase
      .from("user_interactions")
      .select("entity_id, ts")
      .eq("user_id", userId)
      .eq("entity_type", "blog")
      .eq("action", "read")
      .order("ts", { ascending: false })
      .limit(50);

    for (const [index, row] of (data ?? []).entries()) {
      const boost = Math.max(1, 50 - index);
      weights.set(row.entity_id, (weights.get(row.entity_id) ?? 0) + boost);
    }
    return weights;
  }

  // Stub: future Metrika/GA4 category aggregation would populate weights here.
  return weights;
}

export async function buildServerBlogAnalyticsSignals(
  supabase: DbClient,
  userId: string,
  localHistory: BlogReadingHistoryEntry[],
  catalog: BlogPost[],
): Promise<BlogAnalyticsSignals> {
  const { data: historyRows } = await supabase
    .from("blog_reading_history")
    .select("article_slug, article_title, category, read_at")
    .eq("user_id", userId)
    .order("read_at", { ascending: false })
    .limit(12);

  const remote: BlogReadingHistoryEntry[] = (historyRows ?? []).map((row) => ({
    slug: row.article_slug,
    title: row.article_title,
    category: row.category ?? undefined,
    readAt: row.read_at,
  }));

  const base = mergeReadingHistorySignals(localHistory, remote);

  const slugWeights = await loadServerBlogCategoryWeights(supabase, userId);
  for (const [slug, weight] of slugWeights) {
    const post = catalog.find((entry) => entry.slug === slug);
    if (post?.category) {
      base.categoryWeights.set(
        post.category,
        (base.categoryWeights.get(post.category) ?? 0) + weight,
      );
    }
  }

  for (const entry of [...base.readSlugs]) {
    const post = catalog.find((item) => item.slug === entry);
    if (!post) continue;
    for (const tag of post.tags) {
      base.tagWeights.set(tag, (base.tagWeights.get(tag) ?? 0) + 1);
    }
  }

  base.source = remote.length > 0 || slugWeights.size > 0 ? "server" : base.source;
  return base;
}

export async function getServerPersonalizedBlogPosts(
  supabase: DbClient,
  catalog: BlogPost[],
  localHistory: BlogReadingHistoryEntry[],
  userId: string | null,
  limit = 4,
): Promise<BlogPost[]> {
  if (!userId) {
    return getPersonalizedBlogPosts(catalog, localHistory, limit);
  }

  const signals = await buildServerBlogAnalyticsSignals(supabase, userId, localHistory, catalog);
  return scoreBlogPostsFromSignals(catalog, signals, limit);
}
