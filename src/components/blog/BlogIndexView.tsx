"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import HubHero from "@/components/guide/hub/HubHero";
import BlogCard from "@/components/blog/BlogCard";
import BlogSearchFilters from "@/components/blog/BlogSearchFilters";
import BlogSidebar from "@/components/blog/BlogSidebar";
import BlogStatsOverview from "@/components/blog/BlogStatsOverview";
import {
  blogPosts,
  computeBlogStats,
  filterBlogPosts,
  getBlogCategories,
  getBlogTags,
  sortBlogPostsByDate,
} from "@/data/blog";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";

export default function BlogIndexView() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Все");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const categories = useMemo(() => getBlogCategories(blogPosts), []);
  const tags = useMemo(() => getBlogTags(blogPosts), []);
  const stats = useMemo(() => computeBlogStats(blogPosts), []);
  const freshPosts = useMemo(() => sortBlogPostsByDate(blogPosts).slice(0, 4), []);

  const filteredPosts = useMemo(
    () =>
      sortBlogPostsByDate(
        filterBlogPosts(blogPosts, {
          query,
          category: activeCategory,
          tag: activeTag,
        })
      ),
    [query, activeCategory, activeTag]
  );

  const featuredPost = filteredPosts.find((p) => p.featured);
  const gridPosts = filteredPosts.filter((p) => p.slug !== featuredPost?.slug);

  return (
    <>
      <HubHero
        title="Блог о путешествиях"
        subtitle="Практика, культура и гастрономия — с перекрёстными ссылками на путеводитель, иммиграцию и туры"
        image="https://images.unsplash.com/photo-1516026672322-bc52c61a55d5?w=1920&q=80"
        eyebrow={{ label: "Журнал", href: "/blog" }}
        ctas={[
          { label: "Путеводитель", href: "/guide", variant: "secondary" },
          { label: "Каталог туров", href: "/tours", variant: "primary" },
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

          <BlogStatsOverview stats={stats} className="mt-8" />

          <div className="mt-8 lg:flex lg:items-start lg:gap-8 xl:gap-10">
            <div className="min-w-0 flex-1">
              <BlogSearchFilters
                query={query}
                onQueryChange={setQuery}
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={(cat) => {
                  setActiveCategory(cat);
                  setActiveTag(null);
                }}
                tags={tags}
                activeTag={activeTag}
                onTagChange={setActiveTag}
                resultCount={filteredPosts.length}
              />

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {featuredPost ? <BlogCard post={featuredPost} variant="featured" /> : null}
                {gridPosts.map((post) => (
                  <BlogCard key={post.id} post={post} variant="standard" />
                ))}
              </div>

              {filteredPosts.length === 0 ? (
                <p className="mt-8 rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center text-slate">
                  Статей по вашему запросу нет. Попробуйте сбросить фильтры или откройте{" "}
                  <Link href="/guide" className="font-medium text-sky hover:underline">
                    путеводитель
                  </Link>
                  .
                </p>
              ) : null}
            </div>

            <BlogSidebar freshPosts={freshPosts} />
          </div>
        </div>
      </div>
    </>
  );
}
