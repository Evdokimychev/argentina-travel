import {
  FAVORITES_STORE_KEY,
  FAVORITES_UPDATED_EVENT,
  type FavoriteKind,
  type FavoriteTour,
} from "@/types/tourist";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { assertPermission, canSaveFavorite } from "@/lib/permissions";
import type { SessionUser } from "@/types/user";

type FavoritesStore = Record<string, FavoriteTour[]>;
type FavoriteRemoteKind = "tour" | "excursion";
type FavoriteSyncAction = "add" | "remove";

interface FavoriteSyncQueueItem {
  userId: string;
  kind: FavoriteRemoteKind;
  tourSlug: string;
  tourId: string;
  action: FavoriteSyncAction;
  queuedAt: string;
}

type FavoriteSyncQueue = Record<string, FavoriteSyncQueueItem>;

class FavoriteApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "FavoriteApiError";
    this.status = status;
  }
}

const FAVORITES_SYNC_QUEUE_KEY = "argentina-travel-favorites-sync-queue-v1";

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

function readQueue(): FavoriteSyncQueue {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(FAVORITES_SYNC_QUEUE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as FavoriteSyncQueue;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeQueue(queue: FavoriteSyncQueue) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FAVORITES_SYNC_QUEUE_KEY, JSON.stringify(queue));
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

function canUseServerFavorites() {
  return isSupabaseAuthEnabled();
}

function isRemoteFavoriteKind(kind: FavoriteKind): kind is FavoriteRemoteKind {
  return kind === "tour" || kind === "excursion";
}

function favoriteKey(kind: FavoriteKind, tourSlug: string): string {
  return `${kind}:${tourSlug}`;
}

function queueKey(item: Pick<FavoriteSyncQueueItem, "userId" | "kind" | "tourSlug">): string {
  return `${item.userId}:${favoriteKey(item.kind, item.tourSlug)}`;
}

function sortFavorites(items: FavoriteTour[]): FavoriteTour[] {
  return [...items].sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

function setUserFavorites(userId: string, favorites: FavoriteTour[]) {
  const store = readStore();
  store[userId] = sortFavorites(favorites);
  writeStore(store);
  notifyUpdated();
}

function replaceRemoteFavorites(userId: string, remoteFavorites: FavoriteTour[]) {
  const localFavorites = getUserFavorites(userId);
  const localPlaces = localFavorites.filter((item) => (item.kind ?? "tour") === "place");
  setUserFavorites(userId, [...remoteFavorites, ...localPlaces]);
}

function upsertLocalFavorite(userId: string, tour: Omit<FavoriteTour, "addedAt">): FavoriteTour {
  const store = readStore();
  const current = store[userId] ?? [];
  const kind = tour.kind ?? "tour";
  const existing = current.find(
    (item) => item.tourSlug === tour.tourSlug && (item.kind ?? "tour") === kind
  );
  if (existing) return existing;

  const next: FavoriteTour = {
    ...tour,
    addedAt: new Date().toISOString(),
  };
  store[userId] = [next, ...current];
  writeStore(store);
  notifyUpdated();
  return next;
}

function removeLocalFavoriteBySlug(userId: string, tourSlug: string, kind: FavoriteKind) {
  const store = readStore();
  const current = store[userId] ?? [];
  store[userId] = current.filter(
    (item) => !(item.tourSlug === tourSlug && (item.kind ?? "tour") === kind)
  );
  writeStore(store);
  notifyUpdated();
}

function enqueueSyncOperation(item: Omit<FavoriteSyncQueueItem, "queuedAt">) {
  const queue = readQueue();
  queue[queueKey(item)] = {
    ...item,
    queuedAt: new Date().toISOString(),
  };
  writeQueue(queue);
}

function removeSyncOperation(item: Pick<FavoriteSyncQueueItem, "userId" | "kind" | "tourSlug">) {
  const queue = readQueue();
  const key = queueKey(item);
  if (!queue[key]) return;
  delete queue[key];
  writeQueue(queue);
}

function listQueueForUser(userId: string): FavoriteSyncQueueItem[] {
  return Object.values(readQueue())
    .filter((item) => item.userId === userId)
    .sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
}

function toRemoteItem(favorite: FavoriteTour): {
  itemType: FavoriteRemoteKind;
  itemId: string;
  itemSlug: string;
} | null {
  const kind = favorite.kind ?? "tour";
  if (!isRemoteFavoriteKind(kind)) return null;
  return {
    itemType: kind,
    itemId: favorite.tourId || favorite.tourSlug,
    itemSlug: favorite.tourSlug,
  };
}

function isOfflineLikeError(error: unknown): boolean {
  if (error instanceof FavoriteApiError) {
    return error.status >= 500;
  }

  if (error instanceof TypeError) {
    return true;
  }

  return typeof navigator !== "undefined" && navigator.onLine === false;
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

async function fetchFavoritesFromApi(): Promise<FavoriteTour[]> {
  const response = await fetch("/api/favorites", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new FavoriteApiError(
      response.status,
      await readErrorMessage(response, "Не удалось загрузить избранное")
    );
  }

  const body = (await response.json()) as { favorites?: FavoriteTour[] };
  return Array.isArray(body.favorites) ? body.favorites : [];
}

async function addFavoritesToApi(
  items: Array<{
    itemType: FavoriteRemoteKind;
    itemId: string;
    itemSlug: string;
  }>
) {
  if (!items.length) return;

  const response = await fetch("/api/favorites", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });

  if (!response.ok) {
    throw new FavoriteApiError(
      response.status,
      await readErrorMessage(response, "Не удалось сохранить избранное")
    );
  }
}

async function removeFavoriteFromApi(item: { itemType: FavoriteRemoteKind; itemSlug: string }) {
  const response = await fetch("/api/favorites", {
    method: "DELETE",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });

  if (!response.ok) {
    throw new FavoriteApiError(
      response.status,
      await readErrorMessage(response, "Не удалось удалить избранное")
    );
  }
}

function queueRemoteLocalFavorites(userId: string) {
  const remoteFavorites = getUserFavorites(userId).filter((item) =>
    isRemoteFavoriteKind(item.kind ?? "tour")
  );
  for (const favorite of remoteFavorites) {
    const kind = (favorite.kind ?? "tour") as FavoriteRemoteKind;
    enqueueSyncOperation({
      userId,
      kind,
      tourSlug: favorite.tourSlug,
      tourId: favorite.tourId || favorite.tourSlug,
      action: "add",
    });
  }
}

export async function refreshRemoteFavorites(
  actor: SessionUser | null,
  userId: string
): Promise<{ ok: true } | { error: string }> {
  const gate = assertFavoriteActor(actor, userId);
  if ("error" in gate) return gate;
  if (!canUseServerFavorites()) return { ok: true };

  try {
    const favorites = await fetchFavoritesFromApi();
    replaceRemoteFavorites(userId, favorites);
    return { ok: true };
  } catch (error) {
    if (error instanceof FavoriteApiError) {
      return { error: error.message };
    }
    return { error: "Не удалось загрузить избранное" };
  }
}

export async function flushFavoriteSyncQueue(
  actor: SessionUser | null,
  userId: string
): Promise<{ ok: true } | { error: string }> {
  const gate = assertFavoriteActor(actor, userId);
  if ("error" in gate) return gate;
  if (!canUseServerFavorites()) return { ok: true };
  if (typeof window === "undefined") return { ok: true };
  if (typeof navigator !== "undefined" && !navigator.onLine) return { ok: true };

  const queue = listQueueForUser(userId);
  if (!queue.length) return { ok: true };

  for (const entry of queue) {
    try {
      if (entry.action === "add") {
        await addFavoritesToApi([
          {
            itemType: entry.kind,
            itemId: entry.tourId || entry.tourSlug,
            itemSlug: entry.tourSlug,
          },
        ]);
      } else {
        await removeFavoriteFromApi({ itemType: entry.kind, itemSlug: entry.tourSlug });
      }
      removeSyncOperation(entry);
    } catch (error) {
      if (error instanceof FavoriteApiError && (error.status === 401 || error.status === 403)) {
        return { error: error.message };
      }
      break;
    }
  }

  return refreshRemoteFavorites(actor, userId);
}

export async function syncFavoritesOnLogin(
  actor: SessionUser | null,
  userId: string
): Promise<{ ok: true } | { error: string }> {
  const gate = assertFavoriteActor(actor, userId);
  if ("error" in gate) return gate;
  if (!canUseServerFavorites()) return { ok: true };
  if (typeof window === "undefined") return { ok: true };

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    queueRemoteLocalFavorites(userId);
    return { ok: true };
  }

  const remoteCandidates = getUserFavorites(userId)
    .map(toRemoteItem)
    .filter((item): item is NonNullable<typeof item> => item != null);

  try {
    if (remoteCandidates.length) {
      await addFavoritesToApi(remoteCandidates);
    }
    await flushFavoriteSyncQueue(actor, userId);
    return refreshRemoteFavorites(actor, userId);
  } catch (error) {
    if (isOfflineLikeError(error)) {
      queueRemoteLocalFavorites(userId);
      return { ok: true };
    }
    if (error instanceof FavoriteApiError) {
      return { error: error.message };
    }
    return { error: "Не удалось синхронизировать избранное" };
  }
}

export async function toggleFavoriteWithServerSync(
  actor: SessionUser | null,
  userId: string,
  tour: Omit<FavoriteTour, "addedAt">
): Promise<{ favorited: boolean; queued?: boolean } | { error: string }> {
  const kind = tour.kind ?? "tour";

  if (!isRemoteFavoriteKind(kind) || !canUseServerFavorites()) {
    return toggleFavorite(actor, userId, tour);
  }

  const gate = assertFavoriteActor(actor, userId);
  if ("error" in gate) return gate;

  const alreadyFavorite = isItemFavorite(userId, tour.tourSlug, kind);

  if (alreadyFavorite) {
    removeLocalFavoriteBySlug(userId, tour.tourSlug, kind);
  } else {
    upsertLocalFavorite(userId, tour);
  }

  const nextFavorited = !alreadyFavorite;
  const operation: Omit<FavoriteSyncQueueItem, "queuedAt"> = {
    userId,
    kind,
    tourSlug: tour.tourSlug,
    tourId: tour.tourId || tour.tourSlug,
    action: nextFavorited ? "add" : "remove",
  };

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    enqueueSyncOperation(operation);
    return { favorited: nextFavorited, queued: true };
  }

  try {
    if (nextFavorited) {
      await addFavoritesToApi([
        {
          itemType: kind,
          itemId: tour.tourId || tour.tourSlug,
          itemSlug: tour.tourSlug,
        },
      ]);
    } else {
      await removeFavoriteFromApi({ itemType: kind, itemSlug: tour.tourSlug });
    }

    removeSyncOperation(operation);
    return { favorited: nextFavorited };
  } catch (error) {
    if (isOfflineLikeError(error)) {
      enqueueSyncOperation(operation);
      return { favorited: nextFavorited, queued: true };
    }

    if (nextFavorited) {
      removeLocalFavoriteBySlug(userId, tour.tourSlug, kind);
    } else {
      upsertLocalFavorite(userId, tour);
    }

    if (error instanceof FavoriteApiError) {
      return { error: error.message };
    }
    return { error: "Не удалось обновить избранное" };
  }
}

export function getUserFavorites(userId: string): FavoriteTour[] {
  return readStore()[userId] ?? [];
}

export function isTourFavorite(userId: string, tourSlug: string): boolean {
  return isItemFavorite(userId, tourSlug, "tour");
}

export function isItemFavorite(
  userId: string,
  slug: string,
  kind: FavoriteKind = "tour"
): boolean {
  return getUserFavorites(userId).some(
    (item) => item.tourSlug === slug && (item.kind ?? "tour") === kind
  );
}

export function addFavorite(
  actor: SessionUser | null,
  userId: string,
  tour: Omit<FavoriteTour, "addedAt">
): FavoriteTour | { error: string } {
  const gate = assertFavoriteActor(actor, userId);
  if ("error" in gate) return gate;
  return upsertLocalFavorite(userId, tour);
}

export function removeFavorite(
  actor: SessionUser | null,
  userId: string,
  tourSlug: string,
  kind: FavoriteKind = "tour"
): { ok: true } | { error: string } {
  const gate = assertFavoriteActor(actor, userId);
  if ("error" in gate) return gate;
  removeLocalFavoriteBySlug(userId, tourSlug, kind);
  return { ok: true };
}

export function toggleFavorite(
  actor: SessionUser | null,
  userId: string,
  tour: Omit<FavoriteTour, "addedAt">
): { favorited: boolean } | { error: string } {
  const kind = tour.kind ?? "tour";
  if (isItemFavorite(userId, tour.tourSlug, kind)) {
    const result = removeFavorite(actor, userId, tour.tourSlug, kind);
    if ("error" in result) return result;
    return { favorited: false };
  }

  const result = addFavorite(actor, userId, tour);
  if ("error" in result) return result;
  return { favorited: true };
}
