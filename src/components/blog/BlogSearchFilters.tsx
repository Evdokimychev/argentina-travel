"use client";

import { useId } from "react";
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
  reviewedOnly: boolean;
  onReviewedOnlyChange: (value: boolean) => void;
  resultCount: number;
  onReset: () => void;
  showDrafts?: boolean;
  onShowDraftsChange?: (value: boolean) => void;
  draftCount?: number;
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
  reviewedOnly,
  onReviewedOnlyChange,
  resultCount,
  onReset,
  showDrafts = false,
  onShowDraftsChange,
  draftCount = 0,
}: BlogSearchFiltersProps) {
  const searchId = useId();
  const reviewedId = useId();
  const draftsId = useId();
  const resultsId = useId();
  const hasFilters = Boolean(query.trim() || activeCategory !== "Все" || activeTag || reviewedOnly);

  return (
    <div
      className="rounded-3xl border border-gray-100 bg-white p-4 shadow-card sm:p-5"
      role="search"
      aria-label="Фильтры каталога статей"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold text-charcoal">Каталог статей</h2>
        {hasFilters ? (
          <button
            type="button"
            onClick={onReset}
            className="blog-touch-target inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 text-xs font-medium text-slate transition-colors hover:border-sky/30 hover:bg-sky/5 hover:text-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Сбросить фильтры
          </button>
        ) : null}
      </div>

      <div className="relative mt-4">
        <label htmlFor={searchId} className="sr-only">
          Поиск по блогу
        </label>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
          aria-hidden
        />
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Поиск: Patagonia, виза, malbec, треккинг…"
          className="blog-touch-target w-full rounded-2xl border border-gray-200 bg-surface-muted/40 py-3 pl-11 pr-12 text-sm text-charcoal outline-none transition-colors placeholder:text-slate/70 focus:border-sky/40 focus:bg-white focus:ring-2 focus:ring-sky/15"
          aria-controls={resultsId}
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            className="blog-interactive-target absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full text-slate hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
            aria-label="Очистить поиск"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="mt-4">
        <p id={`${searchId}-categories`} className="text-xs font-semibold uppercase tracking-wider text-slate">
          Категории
        </p>
        <div
          className="-mx-1 mt-2 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 scrollbar-thin"
          role="group"
          aria-labelledby={`${searchId}-categories`}
        >
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

      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4">
        <label
          htmlFor={reviewedId}
          className="blog-touch-target inline-flex cursor-pointer items-center gap-2 text-sm text-charcoal"
        >
          <input
            id={reviewedId}
            type="checkbox"
            checked={reviewedOnly}
            onChange={(event) => onReviewedOnlyChange(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-sky focus:ring-sky/30"
          />
          Только вычитанные
        </label>
        {onShowDraftsChange && draftCount > 0 ? (
          <label
            htmlFor={draftsId}
            className="blog-touch-target inline-flex cursor-pointer items-center gap-2 text-sm text-charcoal"
          >
            <input
              id={draftsId}
              type="checkbox"
              checked={showDrafts}
              onChange={(event) => onShowDraftsChange(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-sky focus:ring-sky/30"
            />
            Показать черновики ({draftCount.toLocaleString("ru-RU")})
          </label>
        ) : null}
      </div>

      {tags.length > 0 ? (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p id={`${searchId}-tags`} className="text-xs font-semibold uppercase tracking-wider text-slate">
            Популярные теги
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-labelledby={`${searchId}-tags`}>
            {tags.map((tag) => {
              const active = activeTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagChange(active ? null : tag)}
                  aria-pressed={active}
                  className={cn(
                    "blog-touch-target rounded-full px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40",
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

      <p id={resultsId} className="mt-4 text-sm text-slate" aria-live="polite" aria-atomic="true">
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
      aria-pressed={active}
      className={cn(
        "blog-touch-target inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40",
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
