"use client";

import { Search, X } from "lucide-react";
import type { BlogCategoryWithCount } from "@/lib/blog-utils";
import { pluralizeArticles } from "@/lib/blog-utils";
import { cn } from "@/lib/cn";

type BlogSearchFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  categories: BlogCategoryWithCount[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  tags: string[];
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
  resultCount: number;
  onReset: () => void;
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
  onReset,
}: BlogSearchFiltersProps) {
  const hasFilters = Boolean(query.trim() || activeCategory !== "Все" || activeTag);

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold text-charcoal">Каталог статей</h2>
        {hasFilters ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-slate transition-colors hover:border-sky/30 hover:bg-sky/5 hover:text-sky"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Сбросить фильтры
          </button>
        ) : null}
      </div>

      <div className="relative mt-4">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Поиск: Patagonia, виза, malbec, треккинг…"
          className="w-full rounded-2xl border border-gray-200 bg-surface-muted/40 py-3 pl-11 pr-10 text-sm text-charcoal outline-none transition-colors placeholder:text-slate/70 focus:border-sky/40 focus:bg-white focus:ring-2 focus:ring-sky/15"
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

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate">Категории</p>
        <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-thin">
          <CategoryChip
            label="Все"
            count={categories.reduce((sum, c) => sum + c.count, 0)}
            active={activeCategory === "Все"}
            onClick={() => onCategoryChange("Все")}
          />
          {categories.map(({ category, count }) => (
            <CategoryChip
              key={category}
              label={category}
              count={count}
              active={activeCategory === category}
              onClick={() => onCategoryChange(category)}
            />
          ))}
        </div>
      </div>

      {tags.length > 0 ? (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate">Популярные теги</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => {
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
                      : "bg-surface-muted text-slate hover:bg-sky/10 hover:text-sky",
                  )}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <p className="mt-4 text-sm text-slate" aria-live="polite">
        {resultCount === 0
          ? "Ничего не найдено — измените запрос или сбросьте фильтры"
          : pluralizeArticles(resultCount)}
      </p>
    </div>
  );
}

function CategoryChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-sky bg-sky text-white shadow-sm"
          : "border-gray-200 bg-white text-charcoal hover:border-sky/30 hover:bg-sky/5",
      )}
    >
      <span className="max-w-[10rem] truncate sm:max-w-none">{label}</span>
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
          active ? "bg-white/20 text-white" : "bg-surface-muted text-slate",
        )}
      >
        {count}
      </span>
    </button>
  );
}
