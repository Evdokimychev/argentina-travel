"use client";

import { useId } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
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
  showDrafts?: boolean;
  onShowDraftsChange?: (value: boolean) => void;
  draftCount?: number;
  variant?: "spotlight" | "panel";
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
  showDrafts = false,
  onShowDraftsChange,
  draftCount = 0,
  variant = "panel",
}: BlogSearchFiltersProps) {
  const searchId = useId();
  const draftsId = useId();
  const resultsId = useId();
  const isSpotlight = variant === "spotlight";
  const totalCount = categories.reduce((sum, category) => sum + category.count, 0);
  const hasFilters = Boolean(query.trim() || activeCategory !== "Все" || activeTag);
  const activeLabel = activeTag
    ? `#${activeTag}`
    : activeCategory !== "Все"
      ? activeCategory
      : query.trim() || null;

  return (
    <div
      id="blog-search"
      className={cn(
        "scroll-mt-24",
        isSpotlight
          ? "rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5"
          : "rounded-3xl border border-gray-100 bg-white p-4 shadow-card sm:p-5",
      )}
      role="search"
      aria-label="Поиск и фильтры блога"
    >
      {isSpotlight ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-sky">
              <SlidersHorizontal className="h-3 w-3" aria-hidden />
              Каталог
            </span>
            <p className="text-sm text-slate">
              <span className="font-semibold tabular-nums text-charcoal">{totalCount}</span>{" "}
              {totalCount === 1 ? "материал" : totalCount < 5 ? "материала" : "материалов"}
              <span className="mx-1.5 text-gray-300" aria-hidden>
                ·
              </span>
              {categories.length} {categories.length === 1 ? "категория" : categories.length < 5 ? "категории" : "категорий"}
            </p>
          </div>
          {hasFilters ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-slate transition-colors hover:bg-gray-100 hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Сбросить
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-bold text-charcoal">Каталог статей</h2>
          {hasFilters ? (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 text-xs font-medium text-slate transition-colors hover:border-sky/30 hover:bg-sky/5 hover:text-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              Сбросить
            </button>
          ) : null}
        </div>
      )}

      <div className={cn("relative", isSpotlight ? "mt-3" : "mt-4")}>
        <label htmlFor={searchId} className="sr-only">
          Поиск по блогу
        </label>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate"
          aria-hidden
        />
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Регион, виза, треккинг, бюджет, связь…"
          className="blog-touch-target w-full rounded-xl border border-gray-200 bg-surface-muted/30 py-2.5 pl-10 pr-10 text-sm text-charcoal outline-none transition-colors placeholder:text-slate/60 focus:border-sky/40 focus:bg-white focus:ring-2 focus:ring-sky/10"
          aria-controls={resultsId}
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
            aria-label="Очистить поиск"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <p
          id={resultsId}
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tabular-nums",
            hasFilters ? "bg-sky/10 text-sky" : "bg-surface-muted text-slate",
          )}
          aria-live="polite"
          aria-atomic="true"
        >
          {resultCount === 0
            ? "Ничего не найдено"
            : hasFilters
              ? `Найдено: ${resultCount}`
              : `${resultCount} в каталоге`}
        </p>
        {activeLabel ? (
          <span className="inline-flex max-w-[14rem] truncate rounded-full border border-sky/20 bg-sky/5 px-2.5 py-1 text-xs font-medium text-sky">
            {activeLabel}
          </span>
        ) : null}
        {onShowDraftsChange && draftCount > 0 ? (
          <label
            htmlFor={draftsId}
            className="ml-auto inline-flex cursor-pointer items-center gap-1.5 text-xs text-slate"
          >
            <input
              id={draftsId}
              type="checkbox"
              checked={showDrafts}
              onChange={(event) => onShowDraftsChange(event.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-sky focus:ring-sky/30"
            />
            Черновики ({draftCount})
          </label>
        ) : null}
      </div>

      <div className="mt-3">
        <div
          className="-mx-0.5 flex gap-1.5 overflow-x-auto overscroll-x-contain px-0.5 pb-0.5 scrollbar-thin"
          role="group"
          aria-label="Категории"
        >
          <CategoryChip
            label="Все"
            count={totalCount}
            active={activeCategory === "Все" && !activeTag}
            onClick={() => {
              onCategoryChange("Все");
              onTagChange(null);
            }}
          />
          {categories.map(({ category, count }) => (
            <CategoryChip
              key={category}
              label={category}
              count={count}
              active={activeCategory === category && !activeTag}
              onClick={() => {
                onCategoryChange(category);
                onTagChange(null);
              }}
            />
          ))}
        </div>
      </div>

      {tags.length > 0 ? (
        <div className="mt-2.5">
          <div
            className="-mx-0.5 flex gap-1 overflow-x-auto overscroll-x-contain px-0.5 pb-0.5 scrollbar-thin"
            role="group"
            aria-label="Популярные теги"
          >
            {tags.slice(0, 12).map((tag) => {
              const active = activeTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    onTagChange(active ? null : tag);
                    if (!active) onCategoryChange("Все");
                  }}
                  aria-pressed={active}
                  className={cn(
                    "shrink-0 rounded-md px-2 py-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40",
                    active
                      ? "bg-charcoal text-white"
                      : "bg-surface-muted/80 text-slate hover:bg-sky/10 hover:text-sky",
                  )}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
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
        "inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40",
        active
          ? "border-sky bg-sky text-white"
          : "border-transparent bg-surface-muted/70 text-charcoal hover:bg-sky/8 hover:text-sky",
      )}
    >
      <span className="max-w-[9rem] truncate sm:max-w-none">{label}</span>
      <span
        className={cn(
          "rounded px-1 text-[10px] font-semibold tabular-nums",
          active ? "bg-white/20 text-white" : "text-slate",
        )}
      >
        {count}
      </span>
    </button>
  );
}
