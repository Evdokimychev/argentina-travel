"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import BlogCard from "@/components/blog/BlogCard";
import { trackBlogInlineRelatedClick } from "@/lib/analytics/gtm-events";
import { cn } from "@/lib/cn";
import type { BlogPost } from "@/types";

type BlogInlineRelatedPostsProps = {
  posts: BlogPost[];
  sourceSlug?: string;
  className?: string;
};

/** Компактный блок связанных материалов после секции статьи. */
export default function BlogInlineRelatedPosts({
  posts,
  sourceSlug,
  className,
}: BlogInlineRelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <aside
      className={cn(
        "rounded-2xl border border-sky/15 bg-gradient-to-br from-sky/[0.04] to-white p-4 shadow-sm sm:p-5",
        className,
      )}
      aria-label="По теме секции"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-sky">По теме</p>
      <ul className="mt-3 space-y-2">
        {posts.map((post) => (
          <li
            key={post.id}
            onClick={() => {
              if (!sourceSlug) return;
              trackBlogInlineRelatedClick({
                sourceSlug,
                targetSlug: post.slug,
                targetTitle: post.title,
              });
            }}
          >
            <BlogCard post={post} variant="compact" />
          </li>
        ))}
      </ul>
      <Link
        href={`/blog?category=${encodeURIComponent(posts[0].category)}`}
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky hover:underline"
      >
        Ещё в разделе «{posts[0].category}»
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Link>
    </aside>
  );
}
