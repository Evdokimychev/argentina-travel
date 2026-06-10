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

function scoreText(
  text: string,
  tokens: string[],
  fullQuery: string,
  weights: { phrase: number; exact: number; prefix: number; includes: number }
): number {
  const haystack = normalize(text);
  if (!haystack) return 0;

  let score = 0;
  if (haystack.includes(fullQuery)) score += weights.phrase;

  for (const token of tokens) {
    if (haystack === token) score += weights.exact;
    else if (haystack.startsWith(token)) score += weights.prefix;
    else if (haystack.includes(token)) score += weights.includes;
  }

  return score;
}

function scoreItem(item: SearchIndexItem, tokens: string[]): number {
  if (tokens.length === 0) return 0;

  const fullQuery = tokens.join(" ");
  let score = scoreText(item.title, tokens, fullQuery, {
    phrase: 15,
    exact: 10,
    prefix: 7,
    includes: 5,
  });

  score += scoreText(item.description ?? "", tokens, fullQuery, {
    phrase: 4,
    exact: 3,
    prefix: 2,
    includes: 2,
  });

  for (const keyword of item.keywords ?? []) {
    score += scoreText(keyword, tokens, fullQuery, {
      phrase: 6,
      exact: 4,
      prefix: 3,
      includes: 2,
    });
  }

  return score;
}

const TYPE_ORDER: SearchResultType[] = [
  "tour",
  "blog",
  "guide",
  "destination",
  "immigration",
  "page",
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
