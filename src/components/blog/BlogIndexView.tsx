"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import HubHero from "@/components/guide/hub/HubHero";
import BlogCard from "@/components/blog/BlogCard";
import BlogSearchFilters from "@/components/blog/BlogSearchFilters";
import BlogSidebar from "@/components/blog/BlogSidebar";
import BlogStartHere from "@/components/blog/BlogStartHere";
import BlogStatsOverview from "@/components/blog/BlogStatsOverview";
import BlogTopicHubs from "@/components/blog/BlogTopicHubs";
import {
  blogPosts,
  computeBlogStats,
  filterBlogPosts,
  getBlogCategoriesWithCounts,
  getEditorialBlogPosts,
  getTopBlogTags,
  sortBlogPostsByDate,
} from "@/data/blog";
import { getEditorialProgress } from "@/data/blog-editorial";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";
import type { BlogPost } from "@/types";

const PAGE_SIZE = 12;

type BlogIndexViewProps = {
  posts?: BlogPost[];
};

export default function BlogIndexView({ posts }: BlogIndexViewProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Все");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const catalogRef = useRef<HTMLElement>(null);

  const catalogPosts = useMemo(
    () => sortBlogPostsByDate(posts?.length ? posts : blogPosts),
    [posts],
  );
  const editorialPosts = useMemo(() => {
    if (!posts?.length) return sortBlogPostsByDate(getEditorialBlogPosts());
    const featuredPosts = sortBlogPostsByDate(catalogPosts.filter((post) => post.featured)).slice(0, 8);
    return featuredPosts.length > 0 ? featuredPosts : sortBlogPostsByDate(getEditorialBlogPosts());
  }, [posts, catalogPosts]);
  const categoriesWithCounts = useMemo(() => getBlogCategoriesWithCounts(catalogPosts), [catalogPosts]);
  const tags = useMemo(() => getTopBlogTags(catalogPosts, 14), [catalogPosts]);
  const stats = useMemo(() => computeBlogStats(catalogPosts), [catalogPosts]);
  const editorialProgress = useMemo(() => getEditorialProgress(), []);
  const freshPosts = useMemo(() => catalogPosts.slice(0, 4), [catalogPosts]);

  const hasActiveFilters = Boolean(query.trim() || activeCategory !== "Все" || activeTag);

  const filteredPosts = useMemo(
    () =>
      sortBlogPostsByDate(
        filterBlogPosts(catalogPosts, {
          query,
          category: activeCategory,
          tag: activeTag,
        }),
      ),
    [catalogPosts, query, activeCategory, activeTag],
  );

  const displayedPosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, activeCategory, activeTag]);

  function resetFilters() {
    setQuery("");
    setActiveCategory("Все");
    setActiveTag(null);
  }

  function selectCategory(category: string) {
    setActiveCategory(category);
    setActiveTag(null);
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <HubHero
        title="Блог о путешествиях"
        subtitle={`${stats.totalPosts.toLocaleString("ru-RU")} материалов по ${stats.categories.length} темам — от Патагонии и Игуасу до денег, виз и районов Буэнос-Айреса. Начните с редакционных материалов или выберите тему ниже.`}
        image="https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1920&q=80"
        eyebrow={{ label: "Журнал", href: "/blog" }}
        ctas={[
          { label: "Путеводитель", href: "/guide", variant: "secondary" },
          { label: "Справочник мест", href: "/places", variant: "primary" },
        ]}
      />

      <div className="bg-surface-muted pb-16">
        <div className={cn(siteContainerClass, "py-8 md:py-10")}>
          <nav className="text-sm text-slate" aria-label="Хлебные крошки">
            <Link href="/" className="transition-colors hover:text-sky">
              Главная
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-charcoal">Блог</span>
          </nav>

          <BlogStatsOverview
            stats={stats}
            editorialCount={editorialPosts.length}
            editorialProgress={editorialProgress}
            className="mt-8"
          />

          {!hasActiveFilters ? (
            <>
              <BlogStartHere posts={editorialPosts} className="mt-10" />
              <BlogTopicHubs
                categories={categoriesWithCounts}
                activeCategory={activeCategory}
                onCategorySelect={selectCategory}
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
                    setActiveTag(null);
                  }}
                  tags={tags}
                  activeTag={activeTag}
                  onTagChange={setActiveTag}
                  resultCount={filteredPosts.length}
                  onReset={resetFilters}
                />

                {displayedPosts.length > 0 ? (
                  <ul className="mt-6 grid gap-5 sm:grid-cols-2">
                    {displayedPosts.map((post) => (
                      <li key={post.id}>
                        <BlogCard post={post} variant="standard" />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-8 rounded-panel border border-dashed border-border-subtle bg-surface-elevated p-10 text-center text-slate">
                    Статей по вашему запросу нет. Попробуйте сбросить фильтры или откройте{" "}
                    <Link href="/guide" className="font-medium text-sky hover:underline">
                      путеводитель
                    </Link>
                    .
                  </p>
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

              {/* Свежие материалы на планшете/мобиле — sidebar скрыт до xl */}
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
