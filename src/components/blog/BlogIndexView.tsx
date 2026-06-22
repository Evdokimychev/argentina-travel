"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HubHero from "@/components/guide/hub/HubHero";
import BlogCard from "@/components/blog/BlogCard";
import BlogEditorialHubs from "@/components/blog/BlogEditorialHubs";
import BlogEmptyCatalogState from "@/components/blog/BlogEmptyCatalogState";
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
import type { BlogPost } from "@/types";

const PAGE_SIZE = 12;

type BlogIndexViewProps = {
  posts?: BlogPost[];
};

function BlogIndexViewContent({ posts }: BlogIndexViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Все");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [reviewedOnly, setReviewedOnly] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const catalogRef = useRef<HTMLElement>(null);

  const allCatalogPosts = useMemo(
    () => sortBlogPostsByDate(posts?.length ? posts : blogPosts),
    [posts],
  );

  const catalogPosts = useMemo(() => {
    if (showDrafts) return allCatalogPosts;
    return filterIndexableBlogPosts(allCatalogPosts);
  }, [allCatalogPosts, showDrafts]);

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
  const stats = useMemo(() => computeBlogStats(allCatalogPosts), [allCatalogPosts]);
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
  }, [query, activeCategory, activeTag, reviewedOnly, showDrafts]);

  useEffect(() => {
    const tagFromUrl = searchParams.get("tag")?.trim();
    if (tagFromUrl) {
      setActiveTag(tagFromUrl);
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
  }

  return (
    <>
      <HubHero
        title="Блог о путешествиях"
        subtitle={`${stats.indexablePosts.toLocaleString("ru-RU")} материалов в поиске${stats.draftPosts > 0 ? ` и ${stats.draftPosts.toLocaleString("ru-RU")} в доработке` : ""} — от Патагонии и Игуасу до денег, въезда и районов Буэнос-Айреса. Начните с редакционных материалов или выберите тему ниже.`}
        image={getServicePageHeroImage("blog-index")}
        eyebrow={{ label: "Журнал", href: "/blog" }}
        ctas={[
          { label: "Путеводитель", href: "/guide", variant: "secondary" },
          { label: "Справочник мест", href: "/places", variant: "primary" },
        ]}
      />

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
              <BlogEditorialHubs posts={indexableCatalog} className="mt-10" />
              <BlogTopicHubs
                categories={categoriesWithCounts}
                activeCategory={activeCategory}
                onCategorySelect={(category) => {
                  setActiveCategory(category);
                  handleTagChange(null);
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
                  onCategoryChange={(cat) => {
                    setActiveCategory(cat);
                    handleTagChange(null);
                  }}
                  tags={tags}
                  activeTag={activeTag}
                  onTagChange={handleTagChange}
                  reviewedOnly={reviewedOnly}
                  onReviewedOnlyChange={setReviewedOnly}
                  showDrafts={showDrafts}
                  onShowDraftsChange={setShowDrafts}
                  draftCount={stats.draftPosts}
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
