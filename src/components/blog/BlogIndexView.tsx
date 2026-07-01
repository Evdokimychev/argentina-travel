"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BlogIndexUrlSync from "@/components/blog/BlogIndexUrlSync";
import BlogCard from "@/components/blog/BlogCard";
import BlogEmptyCatalogState from "@/components/blog/BlogEmptyCatalogState";
import BlogIndexDiscoverySidebar, {
  BlogIndexSecondaryDiscovery,
  BlogStartHereStrip,
} from "@/components/blog/BlogIndexDiscoverySidebar";
import { buttonVariants } from "@/components/ui/button";
import PageBreadcrumbs from "@/components/navigation/PageBreadcrumbs";
import {
  blogPosts,
  filterBlogPosts,
  getBlogCategoriesWithCounts,
  getBlogStartHerePosts,
  getTopBlogTags,
  sortBlogPostsByDate,
} from "@/data/blog";
import { filterIndexableBlogPosts, resolveBlogCardVariant } from "@/lib/blog-utils";
import { BLOG_HERO_VARIANT_KEY, type BlogHeroVariant } from "@/lib/blog-hero-variant";
import BlogSearchFilters from "@/components/blog/BlogSearchFilters";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";
import type { BlogPost, TourListing } from "@/types";
import "@/components/blog/blog-index.css";

const PAGE_SIZE = 12;

type BlogIndexViewProps = {
  posts?: BlogPost[];
  initialTours?: TourListing[];
  initialPersonalizedPosts?: BlogPost[];
  heroVariant?: BlogHeroVariant;
  initialTag?: string | null;
  initialCategory?: string | null;
};

export default function BlogIndexView({
  posts,
  initialTours = [],
  initialPersonalizedPosts = [],
  heroVariant = "a",
  initialTag = null,
  initialCategory = null,
}: BlogIndexViewProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(initialCategory?.trim() || "Все");
  const [activeTag, setActiveTag] = useState<string | null>(initialTag?.trim() || null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const catalogRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const catalogPosts = useMemo(
    () => filterIndexableBlogPosts(sortBlogPostsByDate(posts?.length ? posts : blogPosts)),
    [posts],
  );

  const indexableCatalog = useMemo(
    () => filterIndexableBlogPosts(catalogPosts),
    [catalogPosts],
  );

  const editorialPosts = useMemo(() => getBlogStartHerePosts(), []);
  const categoriesWithCounts = useMemo(
    () => getBlogCategoriesWithCounts(indexableCatalog),
    [indexableCatalog],
  );
  const tags = useMemo(() => getTopBlogTags(indexableCatalog, 14), [indexableCatalog]);
  const freshPosts = useMemo(
    () => sortBlogPostsByDate(indexableCatalog).slice(0, 4),
    [indexableCatalog],
  );

  const hasActiveFilters = Boolean(query.trim() || activeCategory !== "Все" || activeTag);

  const filteredPosts = useMemo(() => {
    const result = filterBlogPosts(catalogPosts, {
      query,
      category: activeCategory,
      tag: activeTag,
    });
    return sortBlogPostsByDate(result);
  }, [catalogPosts, query, activeCategory, activeTag]);

  const displayedPosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;
  const featuredUsed = { value: false };

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, activeCategory, activeTag]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(BLOG_HERO_VARIANT_KEY, heroVariant);
  }, [heroVariant]);

  const scrollToResults = useCallback(() => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleTagFromUrl = useCallback((tag: string | null) => {
    setActiveTag(tag);
  }, []);

  const handleCategoryFromUrl = useCallback((category: string | null) => {
    if (!category) return;
    setActiveCategory(category);
    setActiveTag(null);
  }, []);

  function syncTagInUrl(tag: string | null) {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    if (tag) params.set("tag", tag);
    else params.delete("tag");
    const qs = params.toString();
    router.replace(qs ? `/blog?${qs}` : "/blog", { scroll: false });
  }

  function syncCategoryInUrl(category: string) {
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    if (category !== "Все") params.set("category", category);
    else params.delete("category");
    params.delete("tag");
    const qs = params.toString();
    router.replace(qs ? `/blog?${qs}` : "/blog", { scroll: false });
  }

  function handleCategoryChange(category: string) {
    setActiveCategory(category);
    handleTagChange(null);
    syncCategoryInUrl(category);
  }

  function handleTagChange(tag: string | null) {
    setActiveTag(tag);
    syncTagInUrl(tag);
  }

  function resetFilters() {
    setQuery("");
    setActiveCategory("Все");
    setActiveTag(null);
    syncTagInUrl(null);
    syncCategoryInUrl("Все");
  }

  function handleSidebarCategorySelect(category: string) {
    handleCategoryChange(category);
    scrollToResults();
  }

  function renderCatalogResults(showHeading: boolean, className?: string) {
    featuredUsed.value = false;

    const headingLabel = hasActiveFilters
      ? activeTag
        ? `Тег «${activeTag}»`
        : activeCategory !== "Все"
          ? activeCategory
          : query.trim()
            ? `Поиск: «${query.trim()}»`
            : "Результаты"
      : "Все материалы";

    return (
      <div
        ref={resultsRef}
        id="blog-results"
        className={cn("scroll-mt-24", className)}
      >
        {showHeading ? (
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-heading text-lg font-bold text-charcoal sm:text-xl">
              {headingLabel}
            </h2>
            <p className="text-xs tabular-nums text-slate sm:text-sm">
              {filteredPosts.length}{" "}
              {filteredPosts.length === 1
                ? "материал"
                : filteredPosts.length < 5
                  ? "материала"
                  : "материалов"}
            </p>
          </div>
        ) : null}

        {displayedPosts.length > 0 ? (
          <ul
            className={cn(
              "grid gap-3 sm:grid-cols-2 sm:gap-4",
              hasActiveFilters ? "xl:grid-cols-3" : "lg:grid-cols-2",
              showHeading ? "mt-4" : "mt-0",
            )}
          >
            {displayedPosts.map((post, index) => {
              const variant = resolveBlogCardVariant(post, index, featuredUsed);
              return (
                <li
                  key={post.id}
                  className={variant === "featured" && !hasActiveFilters ? "sm:col-span-2" : undefined}
                >
                  <BlogCard
                    post={post}
                    variant={hasActiveFilters ? "standard" : variant}
                    priority={index === 0 && variant === "featured" && !hasActiveFilters}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <BlogEmptyCatalogState onReset={resetFilters} className={showHeading ? "mt-4" : undefined} />
        )}

        {hasMore ? (
          <div className="mt-6 flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-8")}
            >
              Показать ещё {Math.min(PAGE_SIZE, filteredPosts.length - visibleCount)}
            </button>
            <p className="text-xs text-slate">
              Показано {displayedPosts.length} из {filteredPosts.length}
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      <BlogIndexUrlSync
        onTagFromUrl={handleTagFromUrl}
        onCategoryFromUrl={handleCategoryFromUrl}
        onScrollToResults={scrollToResults}
      />
      <div className="bg-surface-muted pb-12">
        <div className={cn(siteContainerClass, "blog-index py-5 md:py-6")}>
          <PageBreadcrumbs
            items={[
              { label: "Главная", href: "/" },
              { label: "Блог" },
            ]}
          />

          <div className="blog-index-toolbar mt-4">
            <BlogSearchFilters
              variant="spotlight"
              query={query}
              onQueryChange={setQuery}
              categories={categoriesWithCounts}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
              tags={tags}
              activeTag={activeTag}
              onTagChange={handleTagChange}
              resultCount={filteredPosts.length}
              onReset={resetFilters}
            />
          </div>

          <div
            className={cn(
              "mt-5",
              !hasActiveFilters &&
                "lg:grid lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-10",
            )}
          >
            <div className="min-w-0">
              {!hasActiveFilters ? (
                <BlogStartHereStrip posts={editorialPosts} className="mb-5 lg:hidden" />
              ) : null}

              <section ref={catalogRef} id="blog-catalog" className="scroll-mt-24">
                {renderCatalogResults(true)}
              </section>

              {!hasActiveFilters ? (
                <BlogIndexSecondaryDiscovery
                  catalog={indexableCatalog}
                  initialTours={initialTours}
                  className="mt-10 border-t border-gray-200/80 pt-10"
                />
              ) : null}
            </div>

            {!hasActiveFilters ? (
              <BlogIndexDiscoverySidebar
                categories={categoriesWithCounts}
                activeCategory={activeCategory}
                onCategorySelect={handleSidebarCategorySelect}
                startHerePosts={editorialPosts}
                catalog={indexableCatalog}
                initialPersonalizedPosts={initialPersonalizedPosts}
                freshPosts={freshPosts}
                className="hidden lg:block"
              />
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
