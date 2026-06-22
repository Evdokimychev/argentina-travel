"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HubHero from "@/components/guide/hub/HubHero";
import BlogCard from "@/components/blog/BlogCard";
import BlogEditorialHubs from "@/components/blog/BlogEditorialHubs";
import BlogEmptyCatalogState from "@/components/blog/BlogEmptyCatalogState";
import BlogHeroSearch from "@/components/blog/BlogHeroSearch";
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
  const [reviewedOnly, setReviewedOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const catalogRef = useRef<HTMLElement>(null);

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

  const hasActiveFilters = Boolean(
    query.trim() || activeCategory !== "Все" || activeTag || reviewedOnly,
  );

  const filteredPosts = useMemo(() => {
    let result = filterBlogPosts(catalogPosts, {
      query,
      category: activeCategory,
      tag: activeTag,
    });
    if (reviewedOnly) {
      result = result.filter((post) => post.editorialReviewed || Boolean(post.richArticleId));
    }
    return sortBlogPostsByDate(result);
  }, [catalogPosts, query, activeCategory, activeTag, reviewedOnly]);

  const displayedPosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;
  const featuredUsed = { value: false };

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, activeCategory, activeTag, reviewedOnly]);

  useEffect(() => {
    const tagFromUrl = searchParams.get("tag")?.trim();
    if (tagFromUrl) {
      setActiveTag(tagFromUrl);
      catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams]);

  useEffect(() => {
    const categoryFromUrl = searchParams.get("category")?.trim();
    if (categoryFromUrl) {
      setActiveCategory(categoryFromUrl);
      setActiveTag(null);
      catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    setReviewedOnly(false);
    syncTagInUrl(null);
    syncCategoryInUrl("Все");
  }

  function scrollToCatalog() {
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
                    { label: copy.secondaryCta, href: "/blog#blog-catalog", variant: "secondary" as const },
                  ]
                : [
                    { label: copy.secondaryCta, href: "/guide", variant: "secondary" as const },
                    { label: copy.primaryCta, href: "/places", variant: "primary" as const },
                  ]
            }
            searchSlot={
              <BlogHeroSearch
                value={query}
                onChange={setQuery}
                onSubmit={scrollToCatalog}
              />
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

          <BlogStatsOverview
            stats={stats}
            editorialCount={editorialPosts.length}
            className="mt-8"
          />

          {!hasActiveFilters ? (
            <>
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
                  catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="mt-10"
              />
            </>
          ) : null}

          <div className="mt-10 lg:flex lg:items-start lg:gap-8 xl:gap-10">
            <div className="min-w-0 flex-1">
              <section ref={catalogRef} id="blog-catalog" className="scroll-mt-24">
                <BlogSearchFilters
                  query={query}
                  onQueryChange={setQuery}
                  categories={categoriesWithCounts}
                  activeCategory={activeCategory}
                  onCategoryChange={handleCategoryChange}
                  tags={tags}
                  activeTag={activeTag}
                  onTagChange={handleTagChange}
                  reviewedOnly={reviewedOnly}
                  onReviewedOnlyChange={setReviewedOnly}
                  resultCount={filteredPosts.length}
                  onReset={resetFilters}
                />

                {displayedPosts.length > 0 ? (
                  <ul className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-5">
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
                  <BlogEmptyCatalogState onReset={resetFilters} />
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
