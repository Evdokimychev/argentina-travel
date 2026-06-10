import {
  FAVORITES_STORE_KEY,
  FAVORITES_UPDATED_EVENT,
  type FavoriteTour,
} from "@/types/tourist";

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

export function getUserFavorites(userId: string): FavoriteTour[] {
  return readStore()[userId] ?? [];
}

export function isTourFavorite(userId: string, tourSlug: string): boolean {
  return getUserFavorites(userId).some((item) => item.tourSlug === tourSlug);
}

export function addFavorite(userId: string, tour: Omit<FavoriteTour, "addedAt">): FavoriteTour {
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

export function removeFavorite(userId: string, tourSlug: string): void {
  const store = readStore();
  const current = store[userId] ?? [];
  store[userId] = current.filter((item) => item.tourSlug !== tourSlug);
  writeStore(store);
  notifyUpdated();
}

export function toggleFavorite(
  userId: string,
  tour: Omit<FavoriteTour, "addedAt">
): { favorited: boolean } {
  if (isTourFavorite(userId, tour.tourSlug)) {
    removeFavorite(userId, tour.tourSlug);
    return { favorited: false };
  }

  addFavorite(userId, tour);
  return { favorited: true };
}
