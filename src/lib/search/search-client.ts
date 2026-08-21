import type { SearchHit, SearchResponse, SearchSource } from "@/lib/search/types";

const SEARCH_DEBOUNCE_MS = 200;
/** Client-side budget so a stalled /api/search cannot leave the dialog on «Идём…» forever. */
export const SEARCH_CLIENT_TIMEOUT_MS = 6_000;

/**
 * Abort the request when either the caller cancels or the client timeout elapses.
 * Timeout must not mark the caller's AbortController as aborted — SiteSearch uses
 * that flag to ignore superseded queries, and a timeout needs the static fallback.
 */
export function mergeSearchAbortSignals(
  callerSignal: AbortSignal | undefined,
  timeoutMs: number,
): { signal: AbortSignal; cleanup: () => void } {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

  const onCallerAbort = () => timeoutController.abort();
  if (callerSignal) {
    if (callerSignal.aborted) {
      timeoutController.abort();
    } else {
      callerSignal.addEventListener("abort", onCallerAbort, { once: true });
    }
  }

  return {
    signal: timeoutController.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      callerSignal?.removeEventListener("abort", onCallerAbort);
    },
  };
}

export async function fetchSiteSearch(
  query: string,
  options?: { kind?: string; signal?: AbortSignal; timeoutMs?: number }
): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { results: [], source: "static", query: trimmed };
  }

  const params = new URLSearchParams({ q: trimmed });
  if (options?.kind) params.set("kind", options.kind);

  const timeoutMs = options?.timeoutMs ?? SEARCH_CLIENT_TIMEOUT_MS;
  const { signal, cleanup } = mergeSearchAbortSignals(options?.signal, timeoutMs);

  try {
    const response = await fetch(`/api/search?${params.toString()}`, { signal });

    if (!response.ok) {
      throw new Error("Search request failed");
    }

    return (await response.json()) as SearchResponse;
  } finally {
    cleanup();
  }
}

function normalizeResultIdentity(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * The generated editorial catalogue can contain distinct legacy URLs with the
 * same visible article title. Keep the highest-ranked occurrence so the search
 * dialog never presents visually indistinguishable choices.
 */
export function dedupeSearchHits(hits: SearchHit[]): SearchHit[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();

  return hits.filter((hit) => {
    const urlKey = normalizeResultIdentity(hit.url);
    const titleKey = `${hit.kind}:${normalizeResultIdentity(hit.title)}`;
    if (seenUrls.has(urlKey) || seenTitles.has(titleKey)) return false;
    seenUrls.add(urlKey);
    seenTitles.add(titleKey);
    return true;
  });
}

export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

export { SEARCH_DEBOUNCE_MS };
export type { SearchHit, SearchResponse, SearchSource };
