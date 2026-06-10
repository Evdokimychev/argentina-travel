import {
  SEARCH_TYPE_LABELS,
  type SearchIndexItem,
  type SearchResultType,
} from "@/lib/site-search-index";

export type SearchResultGroup = {
  type: SearchResultType;
  label: string;
  items: Array<SearchIndexItem & { score: number }>;
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, "е")
    .trim();
}

function tokenize(query: string): string[] {
  return normalize(query)
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

function scoreItem(item: SearchIndexItem, tokens: string[]): number {
  if (tokens.length === 0) return 0;

  const haystacks = [
    item.title,
    item.description ?? "",
    ...(item.keywords ?? []),
  ].map(normalize);

  const fullQuery = tokens.join(" ");
  let score = 0;

  for (const haystack of haystacks) {
    if (haystack.includes(fullQuery)) {
      score += 12;
    }
  }

  for (const token of tokens) {
    for (const haystack of haystacks) {
      if (haystack === token) {
        score += 8;
      } else if (haystack.startsWith(token)) {
        score += 5;
      } else if (haystack.includes(token)) {
        score += 3;
      }
    }
  }

  if (item.type === "tour") score += 1;
  if (item.type === "destination" && tokens.length === 1) score += 1;

  return score;
}

const TYPE_ORDER: SearchResultType[] = [
  "tour",
  "destination",
  "page",
  "blog",
  "faq",
  "legal",
];

export function searchSiteIndex(
  items: SearchIndexItem[],
  query: string,
  limitPerGroup = 5
): SearchResultGroup[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const scored = items
    .map((item) => ({ ...item, score: scoreItem(item, tokens) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, "ru"));

  const groups = new Map<SearchResultType, SearchResultGroup>();

  for (const item of scored) {
    const existing = groups.get(item.type);
    if (existing) {
      if (existing.items.length < limitPerGroup) {
        existing.items.push(item);
      }
      continue;
    }
    groups.set(item.type, {
      type: item.type,
      label: SEARCH_TYPE_LABELS[item.type],
      items: [item],
    });
  }

  return TYPE_ORDER.filter((type) => groups.has(type)).map((type) => groups.get(type)!);
}
