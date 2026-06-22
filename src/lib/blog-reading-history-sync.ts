import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import {
  BLOG_READING_HISTORY_KEY,
  BLOG_READING_HISTORY_UPDATED_EVENT,
  type BlogReadingHistoryEntry,
} from "@/lib/blog-reading-history";
import {
  serializeBlogReadingHistoryCookie,
  blogReadingHistoryCookieAttributes,
  BLOG_READING_HISTORY_COOKIE,
} from "@/lib/blog-reading-history-cookie";

async function fetchRemoteReadingHistory(): Promise<BlogReadingHistoryEntry[]> {
  const response = await fetch("/api/blog/reading-history", { credentials: "same-origin" });
  if (!response.ok) return [];
  const body = (await response.json()) as { entries?: BlogReadingHistoryEntry[] };
  return Array.isArray(body.entries) ? body.entries : [];
}

async function pushReadingHistoryEntry(entry: BlogReadingHistoryEntry): Promise<void> {
  await fetch("/api/blog/reading-history", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug: entry.slug,
      title: entry.title,
      category: entry.category,
      readAt: entry.readAt,
    }),
  });
}

function mergeReadingHistory(
  local: BlogReadingHistoryEntry[],
  remote: BlogReadingHistoryEntry[],
): BlogReadingHistoryEntry[] {
  const merged = new Map<string, BlogReadingHistoryEntry>();

  for (const entry of [...remote, ...local]) {
    const existing = merged.get(entry.slug);
    if (!existing || entry.readAt > existing.readAt) {
      merged.set(entry.slug, entry);
    }
  }

  return [...merged.values()]
    .sort((a, b) => b.readAt.localeCompare(a.readAt))
    .slice(0, 12);
}

function persistMerged(entries: BlogReadingHistoryEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BLOG_READING_HISTORY_KEY, JSON.stringify(entries));
  document.cookie = `${BLOG_READING_HISTORY_COOKIE}=${serializeBlogReadingHistoryCookie(entries)}; ${blogReadingHistoryCookieAttributes()}`;
  window.dispatchEvent(new CustomEvent(BLOG_READING_HISTORY_UPDATED_EVENT));
}

/** Синхронизация localStorage ↔ Supabase (best-effort). */
export async function syncBlogReadingHistoryWithRemote(): Promise<void> {
  if (!isSupabaseAuthEnabled() || typeof window === "undefined") return;

  try {
    const raw = window.localStorage.getItem(BLOG_READING_HISTORY_KEY);
    const local: BlogReadingHistoryEntry[] = raw ? JSON.parse(raw) : [];
    const remote = await fetchRemoteReadingHistory();
    const merged = mergeReadingHistory(local, remote);

    for (const entry of local) {
      if (!remote.some((remoteEntry) => remoteEntry.slug === entry.slug)) {
        await pushReadingHistoryEntry(entry);
      }
    }

    persistMerged(merged);
  } catch {
    // offline / unauthorized — local-only
  }
}

/** Отправка одной записи после чтения статьи. */
export async function syncBlogReadingHistoryEntry(
  entry: BlogReadingHistoryEntry,
): Promise<void> {
  if (!isSupabaseAuthEnabled()) return;

  try {
    await pushReadingHistoryEntry(entry);
  } catch {
    // queue for later sync
  }
}
