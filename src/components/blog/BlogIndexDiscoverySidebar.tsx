"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import BlogEditorialHubs from "@/components/blog/BlogEditorialHubs";
import BlogPersonalizedPosts from "@/components/blog/BlogPersonalizedPosts";
import BlogPopularRoutes from "@/components/blog/BlogPopularRoutes";
import BlogRecommendedTours from "@/components/blog/BlogRecommendedTours";
import BlogSidebar from "@/components/blog/BlogSidebar";
import BlogTrendingDestinations from "@/components/blog/BlogTrendingDestinations";
import type { BlogCategoryWithCount } from "@/lib/blog-utils";
import { cn } from "@/lib/cn";
import type { BlogPost, TourListing } from "@/types";

type BlogIndexDiscoverySidebarProps = {
  categories: BlogCategoryWithCount[];
  activeCategory: string;
  onCategorySelect: (category: string) => void;
  startHerePosts: BlogPost[];
  catalog: BlogPost[];
  initialPersonalizedPosts: BlogPost[];
  freshPosts: BlogPost[];
  className?: string;
};

export default function BlogIndexDiscoverySidebar({
  categories,
  activeCategory,
  onCategorySelect,
  startHerePosts,
  catalog,
  initialPersonalizedPosts,
  freshPosts,
  className,
}: BlogIndexDiscoverySidebarProps) {
  const topCategories = categories.slice(0, 6);

  return (
    <aside className={cn("blog-index-sidebar space-y-4", className)} aria-label="Боковая панель каталога">
      {topCategories.length > 0 ? (
        <div className="blog-index-aside-panel">
          <h2 className="blog-index-aside-panel__title">Популярные темы</h2>
          <ul className="mt-2 space-y-0.5">
            {topCategories.map(({ category, count }) => (
              <li key={category}>
                <button
                  type="button"
                  onClick={() => onCategorySelect(category)}
                  aria-current={activeCategory === category ? "true" : undefined}
                  className="blog-index-category-link w-full text-left"
                >
                  <span className="min-w-0 truncate">{category}</span>
                  <span className="shrink-0 tabular-nums text-xs text-slate">{count}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {startHerePosts.length > 0 ? (
        <div className="blog-index-aside-panel">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-sky" aria-hidden />
            <h2 className="blog-index-aside-panel__title">С чего начать</h2>
          </div>
          <ul className="mt-2 space-y-1">
            {startHerePosts.slice(0, 6).map((post) => (
              <li key={post.id}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="block rounded-lg px-2 py-1.5 text-sm leading-snug text-charcoal transition-colors hover:bg-sky/5 hover:text-sky"
                >
                  {post.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <BlogPersonalizedPosts
        catalog={catalog}
        initialPosts={initialPersonalizedPosts}
        variant="compact"
      />

      <BlogSidebar freshPosts={freshPosts} />
    </aside>
  );
}

type BlogStartHereStripProps = {
  posts: BlogPost[];
  className?: string;
};

/** Горизонтальная полоска «С чего начать» — на узких экранах перед каталогом. */
export function BlogStartHereStrip({ posts, className }: BlogStartHereStripProps) {
  if (posts.length === 0) return null;

  return (
    <nav className={cn(className)} aria-label="С чего начать">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate">С чего начать</p>
      <div className="blog-index-start-strip">
        {posts.slice(0, 8).map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="blog-index-start-strip__link truncate">
            {post.title}
          </Link>
        ))}
      </div>
    </nav>
  );
}

type BlogIndexSecondaryDiscoveryProps = {
  catalog: BlogPost[];
  initialTours: TourListing[];
  className?: string;
};

export function BlogIndexSecondaryDiscovery({
  catalog,
  initialTours,
  className,
}: BlogIndexSecondaryDiscoveryProps) {
  return (
    <div className={cn("blog-index-secondary", className)}>
      <BlogTrendingDestinations />
      <BlogPopularRoutes />
      <BlogEditorialHubs posts={catalog} />
      <BlogRecommendedTours initialTours={initialTours} />
    </div>
  );
}
