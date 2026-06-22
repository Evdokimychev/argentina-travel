import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import {
  getSavedArticlesStore,
  type SavedArticleRecord,
} from "@/lib/saved-articles-store";

async function fetchRemoteSavedArticles(): Promise<SavedArticleRecord[]> {
  const response = await fetch("/api/saved-articles", { credentials: "same-origin" });
  if (!response.ok) return [];
  const body = (await response.json()) as { articles?: SavedArticleRecord[] };
  return Array.isArray(body.articles) ? body.articles : [];
}

async function pushSavedArticle(article: SavedArticleRecord): Promise<void> {
  await fetch("/api/saved-articles", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug: article.slug,
      title: article.title,
      category: article.category,
    }),
  });
}

async function removeRemoteSavedArticle(slug: string): Promise<void> {
  await fetch("/api/saved-articles", {
    method: "DELETE",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug }),
  });
}

function mergeSavedArticles(
  local: SavedArticleRecord[],
  remote: SavedArticleRecord[],
): SavedArticleRecord[] {
  const merged = new Map<string, SavedArticleRecord>();

  for (const entry of [...remote, ...local]) {
    const existing = merged.get(entry.slug);
    if (!existing || entry.savedAt > existing.savedAt) {
      merged.set(entry.slug, entry);
    }
  }

  return [...merged.values()]
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .slice(0, 100);
}

/** Синхронизация localStorage ↔ Supabase (best-effort). */
export async function syncSavedArticlesWithRemote(): Promise<void> {
  if (!isSupabaseAuthEnabled() || typeof window === "undefined") return;

  const store = getSavedArticlesStore();
  const local = store.list();

  try {
    const remote = await fetchRemoteSavedArticles();
    const merged = mergeSavedArticles(local, remote);

    for (const entry of local) {
      if (!remote.some((remoteEntry) => remoteEntry.slug === entry.slug)) {
        await pushSavedArticle(entry);
      }
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "argentina-travel-saved-articles-v1",
        JSON.stringify(merged),
      );
      window.dispatchEvent(new CustomEvent("saved-articles-updated"));
    }
  } catch {
    // offline / unauthorized — local-only
  }
}

export async function syncSavedArticleToggle(
  article: SavedArticleRecord,
  saved: boolean,
): Promise<void> {
  if (!isSupabaseAuthEnabled()) return;

  try {
    if (saved) {
      await pushSavedArticle(article);
    } else {
      await removeRemoteSavedArticle(article.slug);
    }
  } catch {
    // queue for later if needed
  }
}
