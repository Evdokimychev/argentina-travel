import type { BlogPost } from "@/types";
import {
  BLOG_READING_HISTORY_COOKIE,
  blogReadingHistoryCookieAttributes,
  serializeBlogReadingHistoryCookie,
} from "@/lib/blog-reading-history-cookie";

export type BlogReadingHistoryEntry = {
  slug: string;
  title: string;
  readAt: string;
  category?: string;
};

export const BLOG_READING_HISTORY_KEY = "argentina-travel-blog-reading-history-v1";
export const BLOG_READING_HISTORY_UPDATED_EVENT = "blog-reading-history-updated";

const MAX_ENTRIES = 12;

function readRaw(): BlogReadingHistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(BLOG_READING_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BlogReadingHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(entries: BlogReadingHistoryEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BLOG_READING_HISTORY_KEY, JSON.stringify(entries));
}

function notifyUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(BLOG_READING_HISTORY_UPDATED_EVENT));
  }
}

function syncReadingHistoryCookie(entries: BlogReadingHistoryEntry[]) {
  if (typeof document === "undefined") return;
  document.cookie = `${BLOG_READING_HISTORY_COOKIE}=${serializeBlogReadingHistoryCookie(entries)}; ${blogReadingHistoryCookieAttributes()}`;
}

export function recordBlogReading(post: Pick<BlogPost, "slug" | "title" | "category">) {
  const entries = readRaw().filter((entry) => entry.slug !== post.slug);
  entries.unshift({
    slug: post.slug,
    title: post.title,
    category: post.category,
    readAt: new Date().toISOString(),
  });
  const trimmed = entries.slice(0, MAX_ENTRIES);
  writeRaw(trimmed);
  syncReadingHistoryCookie(trimmed);
  notifyUpdated();
}

export function getBlogReadingHistory(limit = 5): BlogReadingHistoryEntry[] {
  return readRaw().slice(0, limit);
}

export function getBlogReadingHistoryExcluding(
  excludeSlug: string,
  limit = 5,
): BlogReadingHistoryEntry[] {
  return readRaw().filter((entry) => entry.slug !== excludeSlug).slice(0, limit);
}
