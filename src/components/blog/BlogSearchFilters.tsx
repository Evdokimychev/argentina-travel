"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

type BlogSearchFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  tags: string[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
  resultCount: number;
};

export default function BlogSearchFilters({
  query,
  onQueryChange,
  categories,
  activeCategory,
  onCategoryChange,
  tags,
  activeTag,
  onTagChange,
  resultCount,
}: BlogSearchFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Поиск по статьям, тегам и категориям…"
          className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-10 text-sm text-charcoal shadow-sm outline-none transition-colors placeholder:text-slate/70 focus:border-sky/40 focus:ring-2 focus:ring-sky/15"
          aria-label="Поиск по блогу"
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate hover:bg-gray-100"
            aria-label="Очистить поиск"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-slate">Категории</span>
        {["Все", ...categories].map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onCategoryChange(category)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              activeCategory === category
                ? "border-sky bg-sky text-white shadow-sm"
                : "border-gray-200 bg-white text-charcoal hover:border-sky/30 hover:bg-sky/5"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {tags.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium uppercase tracking-wider text-slate">Теги</span>
          {tags.slice(0, 12).map((tag) => {
            const active = activeTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onTagChange(active ? null : tag)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "bg-charcoal text-white"
                    : "bg-surface-muted text-slate hover:bg-sky/10 hover:text-sky"
                )}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      ) : null}

      <p className="text-sm text-slate">
        {resultCount === 0
          ? "Ничего не найдено — попробуйте другой запрос или сбросьте фильтры"
          : `${resultCount} ${resultCount === 1 ? "статья" : resultCount < 5 ? "статьи" : "статей"}`}
      </p>
    </div>
  );
}
