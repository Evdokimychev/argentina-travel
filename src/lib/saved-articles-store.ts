import type { BlogPost } from "@/types";

export type SavedArticleRecord = {
  slug: string;
  title: string;
  savedAt: string;
  category?: string;
  image?: string;
};

/** Интерфейс хранилища — localStorage сейчас, Supabase позже. */
export interface SavedArticlesStore {
  list(): SavedArticleRecord[];
  isSaved(slug: string): boolean;
  save(article: SavedArticleRecord): void;
  remove(slug: string): void;
  toggle(post: Pick<BlogPost, "slug" | "title" | "category" | "image">): boolean;
}

export const SAVED_ARTICLES_STORE_KEY = "argentina-travel-saved-articles-v1";
export const SAVED_ARTICLES_UPDATED_EVENT = "saved-articles-updated";

function readRaw(): SavedArticleRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(SAVED_ARTICLES_STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedArticleRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(records: SavedArticleRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SAVED_ARTICLES_STORE_KEY, JSON.stringify(records));
}

function notifyUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SAVED_ARTICLES_UPDATED_EVENT));
  }
}

export const localSavedArticlesStore: SavedArticlesStore = {
  list() {
    return readRaw();
  },

  isSaved(slug: string) {
    return readRaw().some((entry) => entry.slug === slug);
  },

  save(article: SavedArticleRecord) {
    const records = readRaw().filter((entry) => entry.slug !== article.slug);
    records.unshift(article);
    writeRaw(records.slice(0, 100));
    notifyUpdated();
  },

  remove(slug: string) {
    writeRaw(readRaw().filter((entry) => entry.slug !== slug));
    notifyUpdated();
  },

  toggle(post) {
    if (this.isSaved(post.slug)) {
      this.remove(post.slug);
      return false;
    }

    this.save({
      slug: post.slug,
      title: post.title,
      category: post.category,
      image: post.image,
      savedAt: new Date().toISOString(),
    });
    return true;
  },
};

/** Точка расширения для синхронизации с Supabase. */
export function getSavedArticlesStore(): SavedArticlesStore {
  return localSavedArticlesStore;
}
