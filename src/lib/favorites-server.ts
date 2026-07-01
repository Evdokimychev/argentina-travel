import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { FavoriteTour } from "@/types/tourist";
import { resolvePlacePage } from "@/lib/cms/place-resolver";
import { fetchTourDetail } from "@/lib/tours-server";
import { fetchExcursionDetailServer } from "@/lib/excursion-server";

export type FavoriteItemType = "tour" | "excursion" | "place";

export interface FavoriteItemInput {
  itemType: FavoriteItemType;
  itemId: string;
  itemSlug: string;
}

type DbClient = SupabaseClient<Database>;
type UserFavoriteRow = Database["public"]["Tables"]["user_favorites"]["Row"];

function isFavoriteItemType(value: unknown): value is FavoriteItemType {
  return value === "tour" || value === "excursion" || value === "place";
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseFavoriteItemInput(value: unknown): FavoriteItemInput | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as { itemType?: unknown; itemId?: unknown; itemSlug?: unknown };

  if (!isFavoriteItemType(raw.itemType)) return null;
  const itemSlug = normalizeText(raw.itemSlug);
  if (!itemSlug) return null;

  const itemId = normalizeText(raw.itemId) ?? itemSlug;

  return {
    itemType: raw.itemType,
    itemId,
    itemSlug,
  };
}

export async function listUserFavoriteRows(supabase: DbClient, userId: string): Promise<UserFavoriteRow[]> {
  const { data, error } = await supabase
    .from("user_favorites")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Не удалось загрузить избранное");
  }

  return data ?? [];
}

export async function upsertUserFavoriteRows(
  supabase: DbClient,
  userId: string,
  items: FavoriteItemInput[]
): Promise<void> {
  if (!items.length) return;

  const { error } = await supabase.from("user_favorites").upsert(
    items.map((item) => ({
      user_id: userId,
      item_type: item.itemType,
      item_id: item.itemId,
      item_slug: item.itemSlug,
    })),
    {
      onConflict: "user_id,item_type,item_slug",
      ignoreDuplicates: true,
    }
  );

  if (error) {
    throw new Error(error.message || "Не удалось сохранить избранное");
  }
}

export async function deleteUserFavoriteRow(
  supabase: DbClient,
  userId: string,
  item: { itemType: FavoriteItemType; itemSlug: string }
): Promise<void> {
  const { error } = await supabase
    .from("user_favorites")
    .delete()
    .eq("user_id", userId)
    .eq("item_type", item.itemType)
    .eq("item_slug", item.itemSlug);

  if (error) {
    throw new Error(error.message || "Не удалось удалить избранное");
  }
}

async function hydrateFavoriteRow(row: UserFavoriteRow): Promise<FavoriteTour> {
  if (row.item_type === "tour") {
    const detail = await fetchTourDetail(row.item_slug);
    return {
      tourId: row.item_id,
      tourSlug: row.item_slug,
      tourTitle: detail?.title ?? row.item_slug,
      tourImage: detail?.image ?? "",
      region: detail?.region,
      country: detail?.country,
      priceUsd: detail?.priceUsd,
      kind: "tour",
      addedAt: row.created_at,
    };
  }

  if (row.item_type === "excursion") {
    const detail = await fetchExcursionDetailServer(row.item_slug);
    return {
      tourId: row.item_id,
      tourSlug: row.item_slug,
      tourTitle: detail?.title ?? row.item_slug,
      tourImage: detail?.coverImage ?? "",
      cityName: detail?.cityName,
      country: "Аргентина",
      kind: "excursion",
      addedAt: row.created_at,
    };
  }

  const detail = await resolvePlacePage(row.item_slug);
  return {
    tourId: row.item_id,
    tourSlug: row.item_slug,
    tourTitle: detail?.name ?? row.item_slug,
    tourImage: detail?.coverImage ?? "",
    region: detail?.region,
    country: "Аргентина",
    kind: "place",
    addedAt: row.created_at,
  };
}

export async function hydrateUserFavorites(rows: UserFavoriteRow[]): Promise<FavoriteTour[]> {
  const hydrated = await Promise.all(rows.map((row) => hydrateFavoriteRow(row)));
  return hydrated.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}
