import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { SavedArticleRecord } from "@/lib/saved-articles-store";

type DbClient = SupabaseClient<Database>;
type UserFavoriteRow = Database["public"]["Tables"]["user_favorites"]["Row"];

export type SavedArticleInput = {
  slug: string;
  title: string;
  category?: string;
};

function normalizeSlug(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseSavedArticleInput(value: unknown): SavedArticleInput | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as { slug?: unknown; title?: unknown; category?: unknown };
  const slug = normalizeSlug(raw.slug);
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!slug || !title) return null;
  return {
    slug,
    title,
    category: typeof raw.category === "string" ? raw.category : undefined,
  };
}

export async function listUserSavedArticleRows(
  supabase: DbClient,
  userId: string,
): Promise<UserFavoriteRow[]> {
  const { data, error } = await supabase
    .from("user_favorites")
    .select("*")
    .eq("user_id", userId)
    .eq("item_type", "blog")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Не удалось загрузить сохранённые статьи");
  }

  return data ?? [];
}

export function rowsToSavedArticles(rows: UserFavoriteRow[]): SavedArticleRecord[] {
  return rows.map((row) => ({
    slug: row.item_slug,
    title: row.item_id || row.item_slug,
    savedAt: row.created_at,
  }));
}

export async function upsertSavedArticleRow(
  supabase: DbClient,
  userId: string,
  article: SavedArticleInput,
): Promise<void> {
  const { error } = await supabase.from("user_favorites").upsert(
    {
      user_id: userId,
      item_type: "blog",
      item_id: article.title,
      item_slug: article.slug,
    },
    { onConflict: "user_id,item_type,item_slug" },
  );

  if (error) {
    throw new Error(error.message || "Не удалось сохранить статью");
  }
}

export async function deleteSavedArticleRow(
  supabase: DbClient,
  userId: string,
  slug: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("item_type", "blog")
    .eq("item_slug", slug);

  if (error) {
    throw new Error(error.message || "Не удалось удалить статью");
  }
}
