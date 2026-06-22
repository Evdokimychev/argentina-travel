"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HubHero from "@/components/guide/hub/HubHero";
import BlogCard from "@/components/blog/BlogCard";
import BlogEditorialHubs from "@/components/blog/BlogEditorialHubs";
import BlogEmptyCatalogState from "@/components/blog/BlogEmptyCatalogState";
import BlogHeroVariantCopy from "@/components/blog/BlogHeroVariantCopy";
import BlogPersonalizedPosts from "@/components/blog/BlogPersonalizedPosts";
import BlogRecentlyUpdated from "@/components/blog/BlogRecentlyUpdated";
import BlogRecommendedTours from "@/components/blog/BlogRecommendedTours";
import BlogTrendingDestinations from "@/components/blog/BlogTrendingDestinations";
import BlogPopularRoutes from "@/components/blog/BlogPopularRoutes";
import BlogSearchFilters from "@/components/blog/BlogSearchFilters";
import BlogSidebar from "@/components/blog/BlogSidebar";
import BlogStartHere from "@/components/blog/BlogStartHere";
import BlogStatsOverview from "@/components/blog/BlogStatsOverview";
import BlogTopicHubs from "@/components/blog/BlogTopicHubs";
import PageBreadcrumbs from "@/components/navigation/PageBreadcrumbs";
import {
  blogPosts,
  computeBlogStats,
  filterBlogPosts,
  getBlogCategoriesWithCounts,
  getBlogStartHerePosts,
  getTopBlogTags,
  sortBlogPostsByDate,
} from "@/data/blog";
import { filterIndexableBlogPosts, resolveBlogCardVariant } from "@/lib/blog-utils";
import { buttonVariants } from "@/components/ui/button";
import { getServicePageHeroImage } from "@/lib/media-resolver";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";
import type { BlogPost, TourListing } from "@/types";

const PAGE_SIZE = 12;

type BlogIndexViewProps = {
  posts?: BlogPost[];
  initialTours?: TourListing[];
  initialPersonalizedPosts?: BlogPost[];
};

function BlogIndexViewContent({
  posts,
  initialTours = [],
  initialPersonalizedPosts = [],
}: BlogIndexViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Все");
  const [activeTag, setActiveTag] = useState<string | null>(null);
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
  const stats = useMemo(() => computeBlogStats(catalogPosts), [catalogPosts]);
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
    const tagFromUrl = searchParams.get("tag")?.trim();
    if (tagFromUrl) {
      setActiveTag(tagFromUrl);
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams]);

  useEffect(() => {
    const categoryFromUrl = searchParams.get("category")?.trim();
    if (categoryFromUrl) {
      setActiveCategory(categoryFromUrl);
      setActiveTag(null);
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams]);

  function syncTagInUrl(tag: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (tag) params.set("tag", tag);
    else params.delete("tag");
    const qs = params.toString();
    router.replace(qs ? `/blog?${qs}` : "/blog", { scroll: false });
  }

  function syncCategoryInUrl(category: string) {
    const params = new URLSearchParams(searchParams.toString());
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

  function scrollToResults() {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderCatalogResults(showHeading: boolean, className?: string) {
    featuredUsed.value = false;

    return (
      <div
        ref={resultsRef}
        id="blog-results"
        className={cn("scroll-mt-24", className)}
      >
        {showHeading ? (
          <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
            Все статьи
          </h2>
        ) : null}

        {displayedPosts.length > 0 ? (
          <ul className={cn("grid gap-4 sm:grid-cols-2 sm:gap-5", showHeading ? "mt-5" : "mt-0")}>
            {displayedPosts.map((post, index) => {
              const variant = resolveBlogCardVariant(post, index, featuredUsed);
              return (
                <li
                  key={post.id}
                  className={variant === "featured" ? "sm:col-span-2" : undefined}
                >
                  <BlogCard
                    post={post}
                    variant={variant}
                    priority={index === 0 && variant === "featured"}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <BlogEmptyCatalogState onReset={resetFilters} className={showHeading ? "mt-5" : undefined} />
        )}

        {hasMore ? (
          <div className="mt-8 flex flex-col items-center gap-2">
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
      <BlogHeroVariantCopy>
        {(variant, copy) => (
          <HubHero
            title="Блог о путешествиях"
            subtitle={
              variant === "b"
                ? copy.subtitle
                : `${stats.indexablePosts.toLocaleString("ru-RU")} проверенных материалов — ${copy.subtitle}`
            }
            image={getServicePageHeroImage("blog-index")}
            eyebrow={{ label: "Журнал", href: "/blog" }}
            ctas={
              variant === "b"
                ? [
                    { label: copy.primaryCta, href: "/podbor", variant: "primary" as const },
                    { label: copy.secondaryCta, href: "/blog#blog-search", variant: "secondary" as const },
                  ]
                : [
                    { label: copy.secondaryCta, href: "/guide", variant: "secondary" as const },
                    { label: copy.primaryCta, href: "/places", variant: "primary" as const },
                  ]
            }
          />
        )}
      </BlogHeroVariantCopy>

      <div className="bg-surface-muted pb-16">
        <div className={cn(siteContainerClass, "py-8 md:py-10")}>
          <PageBreadcrumbs
            items={[
              { label: "Главная", href: "/" },
              { label: "Блог" },
            ]}
          />

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

          {hasActiveFilters ? renderCatalogResults(false, "mt-6") : null}

          {!hasActiveFilters ? (
            <>
              <BlogStatsOverview
                stats={stats}
                editorialCount={editorialPosts.length}
                className="mt-8"
              />
              <BlogStartHere posts={editorialPosts} className="mt-10" />
              <BlogPersonalizedPosts
                catalog={indexableCatalog}
                initialPosts={initialPersonalizedPosts}
                className="mt-10"
              />
              <BlogRecentlyUpdated posts={indexableCatalog} className="mt-10" />
              <BlogTrendingDestinations className="mt-10" />
              <BlogPopularRoutes className="mt-10" />
              <BlogEditorialHubs posts={indexableCatalog} className="mt-10" />
              <BlogRecommendedTours className="mt-10" initialTours={initialTours} />
              <BlogTopicHubs
                categories={categoriesWithCounts}
                activeCategory={activeCategory}
                onCategorySelect={(category) => {
                  handleCategoryChange(category);
                  scrollToResults();
                }}
                className="mt-10"
              />
            </>
          ) : null}

          {!hasActiveFilters ? (
            <div className="mt-10 lg:flex lg:items-start lg:gap-8 xl:gap-10">
              <div className="min-w-0 flex-1">
                <section ref={catalogRef} id="blog-catalog" className="scroll-mt-24">
                  {renderCatalogResults(true)}
                </section>

                <section className="mt-10 rounded-3xl border border-gray-100 bg-white p-5 shadow-card xl:hidden">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate">Недавние</h2>
                  <ul className="mt-3 space-y-1">
                    {freshPosts.map((post) => (
                      <li key={post.id}>
                        <BlogCard post={post} variant="compact" />
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <BlogSidebar freshPosts={freshPosts} />
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

export default function BlogIndexView(props: BlogIndexViewProps) {
  return (
    <Suspense fallback={null}>
      <BlogIndexViewContent {...props} />
    </Suspense>
  );
}
