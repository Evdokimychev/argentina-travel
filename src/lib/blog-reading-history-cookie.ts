import type { BlogReadingHistoryEntry } from "@/lib/blog-reading-history";

export const BLOG_READING_HISTORY_COOKIE = "argentina-travel-blog-read-v1";
export const BLOG_READING_HISTORY_COOKIE_MAX = 8;

export function serializeBlogReadingHistoryCookie(
  entries: Pick<BlogReadingHistoryEntry, "slug" | "title" | "category">[],
): string {
  return encodeURIComponent(
    JSON.stringify(
      entries.slice(0, BLOG_READING_HISTORY_COOKIE_MAX).map((entry) => ({
        s: entry.slug,
        t: entry.title,
        c: entry.category,
      })),
    ),
  );
}

export function parseBlogReadingHistoryCookie(
  value: string | undefined | null,
): BlogReadingHistoryEntry[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Array<{
      s?: string;
      t?: string;
      c?: string;
    }>;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((entry) => typeof entry.s === "string" && typeof entry.t === "string")
      .map((entry) => ({
        slug: entry.s!,
        title: entry.t!,
        category: entry.c,
        readAt: new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}

export function blogReadingHistoryCookieAttributes(): string {
  const maxAge = 60 * 60 * 24 * 90;
  return `path=/; max-age=${maxAge}; SameSite=Lax`;
}
