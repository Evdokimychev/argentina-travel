import type { BlogPost } from "@/types";

export function formatBlogReadTime(minutes: number): string {
  if (minutes < 1) return "1 мин";
  return `${minutes} мин`;
}

export function formatBlogViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (views >= 10_000) return `${Math.round(views / 1000)}K`;
  if (views >= 1000) return `${(views / 1000).toFixed(1).replace(".0", "")}K`;
  return views.toLocaleString("ru-RU");
}

export type BlogCategoryStat = {
  category: string;
  count: number;
};

export type BlogIndexStats = {
  totalPosts: number;
  totalViews: number;
  averageReadMinutes: number;
  categories: BlogCategoryStat[];
};

export function computeBlogStats(posts: BlogPost[]): BlogIndexStats {
  const categoryMap = new Map<string, number>();
  let totalViews = 0;
  let totalMinutes = 0;

  for (const post of posts) {
    categoryMap.set(post.category, (categoryMap.get(post.category) ?? 0) + 1);
    totalViews += post.views;
    totalMinutes += post.readTimeMinutes;
  }

  return {
    totalPosts: posts.length,
    totalViews,
    averageReadMinutes: posts.length ? Math.round(totalMinutes / posts.length) : 0,
    categories: [...categoryMap.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export function getBlogCategories(posts: BlogPost[]): string[] {
  return [...new Set(posts.map((p) => p.category))].sort((a, b) => a.localeCompare(b, "ru"));
}

export function getBlogTags(posts: BlogPost[]): string[] {
  const tags = new Set<string>();
  for (const post of posts) {
    for (const tag of post.tags) tags.add(tag);
  }
  return [...tags].sort((a, b) => a.localeCompare(b, "ru"));
}

export function filterBlogPosts(
  posts: BlogPost[],
  options: {
    query?: string;
    category?: string | null;
    tag?: string | null;
  }
): BlogPost[] {
  const q = options.query?.trim().toLowerCase() ?? "";
  const category = options.category && options.category !== "Все" ? options.category : null;
  const tag = options.tag;

  return posts.filter((post) => {
    if (category && post.category !== category) return false;
    if (tag && !post.tags.includes(tag)) return false;
    if (!q) return true;

    const haystack = [
      post.title,
      post.excerpt,
      post.category,
      post.author,
      ...post.tags,
      post.content.slice(0, 400),
    ]
      .join(" ")
      .toLowerCase();

    return q.split(/\s+/).every((token) => haystack.includes(token));
  });
}

export function sortBlogPostsByDate(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
