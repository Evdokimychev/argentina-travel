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
