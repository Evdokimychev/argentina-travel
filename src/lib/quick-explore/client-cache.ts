import type { QuickExplorePayload } from "@/lib/quick-explore/types";

const QUICK_EXPLORE_API = "/api/quick-explore";

type CacheSnapshot = {
  data: QuickExplorePayload | null;
  error: string | null;
  loading: boolean;
};

type CacheState = {
  data: QuickExplorePayload | null;
  error: string | null;
  promise: Promise<QuickExplorePayload> | null;
};

const cache: CacheState = {
  data: null,
  error: null,
  promise: null,
};

const listeners = new Set<() => void>();
let mapChunkPrefetched = false;
let idlePrefetchScheduled = false;

const INITIAL_SNAPSHOT: CacheSnapshot = { data: null, error: null, loading: false };
let cachedSnapshot: CacheSnapshot = INITIAL_SNAPSHOT;

function buildCacheSnapshot(): CacheSnapshot {
  const loading = Boolean(cache.promise);
  if (
    cachedSnapshot.data === cache.data &&
    cachedSnapshot.error === cache.error &&
    cachedSnapshot.loading === loading
  ) {
    return cachedSnapshot;
  }
  cachedSnapshot = { data: cache.data, error: cache.error, loading };
  return cachedSnapshot;
}

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeQuickExploreCache(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getQuickExploreCacheSnapshot(): CacheSnapshot {
  return buildCacheSnapshot();
}

/** Synchronous read of cached payload (null if not yet loaded). */
export function getQuickExplorePayloadCache(): QuickExplorePayload | null {
  return cache.data;
}

/** Preload MapLibre canvas chunk after payload is available. */
export function prefetchQuickExploreMapChunk(): void {
  if (mapChunkPrefetched || typeof window === "undefined") return;
  mapChunkPrefetched = true;
  void import("@/components/map/ArgentinaMapLibreCanvasInner");
}

async function requestPayload(): Promise<QuickExplorePayload> {
  const response = await fetch(QUICK_EXPLORE_API);
  if (!response.ok) {
    throw new Error("Не удалось загрузить данные карты");
  }
  return (await response.json()) as QuickExplorePayload;
}

export async function fetchQuickExplorePayload(force = false): Promise<QuickExplorePayload> {
  if (!force && cache.data) return cache.data;
  if (!force && cache.promise) return cache.promise;

  if (force) {
    cache.data = null;
    cache.error = null;
    cachedSnapshot = INITIAL_SNAPSHOT;
  }

  cache.promise = requestPayload()
    .then((data) => {
      cache.data = data;
      cache.error = null;
      prefetchQuickExploreMapChunk();
      return data;
    })
    .catch((err: unknown) => {
      cache.error = err instanceof Error ? err.message : "Ошибка загрузки";
      throw err;
    })
    .finally(() => {
      cache.promise = null;
      notifyListeners();
    });

  notifyListeners();
  return cache.promise;
}

/** Start loading payload immediately (no-op if cached or in flight). */
export function prefetchQuickExplorePayload(): void {
  if (typeof window === "undefined") return;
  if (cache.data || cache.promise) return;
  void fetchQuickExplorePayload();
}

/** Defer payload fetch until the browser is idle — used on initial page load. */
export function scheduleQuickExplorePrefetch(): void {
  if (typeof window === "undefined" || cache.data || cache.promise || idlePrefetchScheduled) {
    return;
  }
  idlePrefetchScheduled = true;

  const run = () => {
    void fetchQuickExplorePayload().catch(() => {
      idlePrefetchScheduled = false;
    });
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(run, { timeout: 3500 });
  } else {
    window.setTimeout(run, 900);
  }
}

/** Alias kept for call sites that expect a Promise return type. */
export async function ensureQuickExplorePayload(): Promise<QuickExplorePayload> {
  return fetchQuickExplorePayload();
}
