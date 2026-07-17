import type { SearchIndexItem } from "@/lib/site-search-schema";

function dedupeByHref(items: SearchIndexItem[]): SearchIndexItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.type}:${item.href}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getDefaultSearchIndex(): SearchIndexItem[] {
  return [];
}

export async function loadSearchIndex(): Promise<SearchIndexItem[]> {
  if (typeof window === "undefined") return getDefaultSearchIndex();

  try {
    const [excursionsRes, staticRes] = await Promise.all([
      fetch("/api/excursions/search-index").catch(() => null),
      fetch("/api/site/search-index").catch(() => null),
    ]);

    const excursionItems =
      excursionsRes?.ok ? ((await excursionsRes.json()) as SearchIndexItem[]) : [];
    const staticItems = staticRes?.ok
      ? ((await staticRes.json()) as SearchIndexItem[])
      : [];

    return dedupeByHref([
      ...excursionItems,
      ...staticItems,
    ]);
  } catch {
    return getDefaultSearchIndex();
  }
}
