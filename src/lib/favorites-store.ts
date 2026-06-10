import {
  FAVORITES_STORE_KEY,
  FAVORITES_UPDATED_EVENT,
  type FavoriteTour,
} from "@/types/tourist";
import { assertPermission, canSaveFavorite } from "@/lib/permissions";
import type { SessionUser } from "@/types/user";

type FavoritesStore = Record<string, FavoriteTour[]>;

function readStore(): FavoritesStore {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as FavoritesStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: FavoritesStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FAVORITES_STORE_KEY, JSON.stringify(store));
}

function notifyUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT));
  }
}

function assertFavoriteActor(actor: SessionUser | null, userId: string): { ok: true } | { error: string } {
  const allowed = assertPermission(canSaveFavorite(actor));
  if ("error" in allowed) return allowed;
  if (!actor || actor.id !== userId) return { error: "Нет доступа" };
  return { ok: true };
}

export function getUserFavorites(userId: string): FavoriteTour[] {
  return readStore()[userId] ?? [];
}

export function isTourFavorite(userId: string, tourSlug: string): boolean {
  return getUserFavorites(userId).some((item) => item.tourSlug === tourSlug);
}

export function addFavorite(
  actor: SessionUser | null,
  userId: string,
  tour: Omit<FavoriteTour, "addedAt">
): FavoriteTour | { error: string } {
  const gate = assertFavoriteActor(actor, userId);
  if ("error" in gate) return gate;

  const store = readStore();
  const current = store[userId] ?? [];

  if (current.some((item) => item.tourSlug === tour.tourSlug)) {
    return current.find((item) => item.tourSlug === tour.tourSlug)!;
  }

  const next: FavoriteTour = {
    ...tour,
    addedAt: new Date().toISOString(),
  };

  store[userId] = [next, ...current];
  writeStore(store);
  notifyUpdated();
  return next;
}

export function removeFavorite(
  actor: SessionUser | null,
  userId: string,
  tourSlug: string
): { ok: true } | { error: string } {
  const gate = assertFavoriteActor(actor, userId);
  if ("error" in gate) return gate;

  const store = readStore();
  const current = store[userId] ?? [];
  store[userId] = current.filter((item) => item.tourSlug !== tourSlug);
  writeStore(store);
  notifyUpdated();
  return { ok: true };
}

export function toggleFavorite(
  actor: SessionUser | null,
  userId: string,
  tour: Omit<FavoriteTour, "addedAt">
): { favorited: boolean } | { error: string } {
  if (isTourFavorite(userId, tour.tourSlug)) {
    const result = removeFavorite(actor, userId, tour.tourSlug);
    if ("error" in result) return result;
    return { favorited: false };
  }

  const result = addFavorite(actor, userId, tour);
  if ("error" in result) return result;
  return { favorited: true };
}
