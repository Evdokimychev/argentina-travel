import type { SearchHit, SearchResponse, SearchSource } from "@/lib/search/types";

const SEARCH_DEBOUNCE_MS = 200;

export async function fetchSiteSearch(
  query: string,
  options?: { kind?: string; signal?: AbortSignal }
): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { results: [], source: "static", query: trimmed };
  }

  const params = new URLSearchParams({ q: trimmed });
  if (options?.kind) params.set("kind", options.kind);

  const response = await fetch(`/api/search?${params.toString()}`, {
    signal: options?.signal,
  });

  if (!response.ok) {
    throw new Error("Search request failed");
  }

  return (await response.json()) as SearchResponse;
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
