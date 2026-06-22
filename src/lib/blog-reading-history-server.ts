import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { BlogReadingHistoryEntry } from "@/lib/blog-reading-history";
import {
  parseBlogReadingHistoryInput,
  type BlogReadingHistoryInput,
} from "@/lib/blog-reading-history-parsers";

export type { BlogReadingHistoryInput };
export { parseBlogReadingHistoryInput };

type DbClient = SupabaseClient<Database>;
type ReadingHistoryRow = Database["public"]["Tables"]["blog_reading_history"]["Row"];

const MAX_ENTRIES = 12;

export function rowToBlogReadingHistoryEntry(row: ReadingHistoryRow): BlogReadingHistoryEntry {
  return {
    slug: row.article_slug,
    title: row.article_title,
    category: row.category ?? undefined,
    readAt: row.read_at,
  };
}

export async function listUserBlogReadingHistoryRows(
  supabase: DbClient,
  userId: string,
  limit = MAX_ENTRIES,
): Promise<ReadingHistoryRow[]> {
  const { data, error } = await supabase
    .from("blog_reading_history")
    .select("*")
    .eq("user_id", userId)
    .order("read_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message || "Не удалось загрузить историю чтения");
  }

  return data ?? [];
}

export async function upsertBlogReadingHistoryRow(
  supabase: DbClient,
  userId: string,
  entry: BlogReadingHistoryInput,
): Promise<void> {
  const { error } = await supabase.from("blog_reading_history").upsert(
    {
      user_id: userId,
      article_slug: entry.slug,
      article_title: entry.title,
      category: entry.category ?? null,
      read_at: entry.readAt ?? new Date().toISOString(),
    },
    { onConflict: "user_id,article_slug" },
  );

  if (error) {
    throw new Error(error.message || "Не удалось сохранить историю чтения");
  }
}

export async function recordBlogReadInteraction(
  supabase: DbClient,
  userId: string,
  slug: string,
): Promise<void> {
  const { error } = await supabase.from("user_interactions").insert({
    user_id: userId,
    entity_type: "blog",
    entity_id: slug,
    action: "read",
  });

  if (error && !error.message.includes("duplicate")) {
    // best-effort analytics log
  }
}

export function rowsToBlogReadingHistory(rows: ReadingHistoryRow[]): BlogReadingHistoryEntry[] {
  return rows.map(rowToBlogReadingHistoryEntry);
}
