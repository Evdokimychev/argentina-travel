"use client";

import { useId, useMemo, useState } from "react";
import BlogCard from "@/components/blog/BlogCard";
import BlogEmptyCatalogState from "@/components/blog/BlogEmptyCatalogState";
import {
  getBlogHubCategoriesWithCounts,
  getBlogHubTopTags,
  type BlogHub,
} from "@/data/blog-hubs";
import { pluralizeArticles, resolveBlogCardVariant } from "@/lib/blog-utils";
import { cn } from "@/lib/cn";
import type { BlogPost } from "@/types";

type BlogHubCatalogProps = {
  hub: BlogHub;
  posts: BlogPost[];
};

export default function BlogHubCatalog({ hub, posts }: BlogHubCatalogProps) {
  const resultsId = useId();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const categories = useMemo(() => getBlogHubCategoriesWithCounts(hub, posts), [hub, posts]);
  const tags = useMemo(() => getBlogHubTopTags(hub, posts, 10), [hub, posts]);

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (activeCategory) {
      result = result.filter((post) => post.category === activeCategory);
    }
    if (activeTag) {
      result = result.filter((post) => post.tags.includes(activeTag));
    }
    return result;
  }, [posts, activeCategory, activeTag]);

  const hasFilters = Boolean(activeCategory || activeTag);
  const featuredUsed = { value: false };

  function resetFilters() {
    setActiveCategory(null);
    setActiveTag(null);
  }

  return (
    <>
      {posts.length > 0 && (
        <div className="mt-6 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-5" role="search" aria-label={`Фильтры раздела «${hub.shortTitle}»`}>
          {categories.length > 1 ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate">Подкатегории</p>
              <div className="-mx-1 mt-2 flex flex-wrap gap-2 px-1">
                <FilterChip
                  label="Все"
                  count={posts.length}
                  active={!activeCategory}
                  onClick={() => setActiveCategory(null)}
                />
                {categories.map(({ category, count }) => (
                  <FilterChip
                    key={category}
                    label={category}
                    count={count}
                    active={activeCategory === category}
                    onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {tags.length > 0 ? (
            <div className={cn(categories.length > 1 && "mt-4 border-t border-gray-100 pt-4")}>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate">Теги</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((tag) => {
                  const active = activeTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setActiveTag(active ? null : tag)}
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

          {hasFilters ? (
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={resetFilters}
                className="blog-touch-target text-sm font-medium text-sky hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40"
              >
                Сбросить
              </button>
            </div>
          ) : null}

          <p id={resultsId} className="mt-3 text-sm text-slate" aria-live="polite" aria-atomic="true">
            {filteredPosts.length === 0
              ? "Ничего не найдено — измените фильтры"
              : pluralizeArticles(filteredPosts.length)}
          </p>
        </div>
      )}

      {filteredPosts.length > 0 ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {filteredPosts.map((post, index) => {
            const variant = resolveBlogCardVariant(post, index, featuredUsed);
            const spanWide = variant === "featured" || (index === 0 && post.richArticleId);
            return (
              <li key={post.id} id={`hub-post-${post.slug}`} className={spanWide ? "sm:col-span-2 scroll-mt-28" : "scroll-mt-28"}>
                <BlogCard post={post} variant={variant} priority={index === 0 && variant === "featured"} />
              </li>
            );
          })}
        </ul>
      ) : hasFilters ? (
        <BlogEmptyCatalogState onReset={resetFilters} />
      ) : null}
    </>
  );
}

function FilterChip({
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
      <span className="max-w-[12rem] truncate sm:max-w-none">{label}</span>
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
