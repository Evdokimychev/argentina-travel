"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { SearchIndexItem } from "@/lib/site-search-index";
import { cn } from "@/lib/cn";

type ExcursionSearchSuggestionsProps = {
  query: string;
  onSelect: (value: string) => void;
  className?: string;
};

function matchExcursionSuggestions(items: SearchIndexItem[], query: string): SearchIndexItem[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  return items
    .filter((item) => {
      const haystack = [item.title, item.description, ...(item.keywords ?? [])]
        .join(" ")
        .toLowerCase();
      return terms.every((term) => haystack.includes(term));
    })
    .slice(0, 6);
}

export default function ExcursionSearchSuggestions({
  query,
  onSelect,
  className,
}: ExcursionSearchSuggestionsProps) {
  const [index, setIndex] = useState<SearchIndexItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/excursions/search-index")
      .then((response) => (response.ok ? response.json() : []))
      .then((data: SearchIndexItem[]) => {
        if (!cancelled) {
          setIndex(Array.isArray(data) ? data : []);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = useMemo(
    () => (query.trim().length >= 2 ? matchExcursionSuggestions(index, query) : []),
    [index, query]
  );

  if (!loaded || suggestions.length === 0) return null;

  return (
    <ul
      className={cn(
        "overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg shadow-charcoal/5",
        className
      )}
      role="listbox"
      aria-label="Подсказки поиска"
    >
      {suggestions.map((item) => (
        <li key={item.id} role="option">
          <Link
            href={item.href}
            className="block border-t border-gray-100 px-4 py-3 first:border-t-0 transition hover:bg-gray-50"
            onClick={() => onSelect(item.title)}
          >
            <p className="text-sm font-medium text-charcoal">{item.title}</p>
            {item.description ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-slate">{item.description}</p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
