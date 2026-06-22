"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import BlogCard from "@/components/blog/BlogCard";
import { getBlogReadingHistory } from "@/lib/blog-reading-history";
import { getPersonalizedBlogPosts } from "@/lib/blog-personalized";
import { cn } from "@/lib/cn";
import type { BlogPost } from "@/types";

type BlogPersonalizedPostsProps = {
  catalog: BlogPost[];
  initialPosts?: BlogPost[];
  className?: string;
};

export default function BlogPersonalizedPosts({
  catalog,
  initialPosts = [],
  className,
}: BlogPersonalizedPostsProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);

  useEffect(() => {
    const history = getBlogReadingHistory(8);
    if (history.length === 0) {
      setPosts([]);
      return;
    }

    const local = getPersonalizedBlogPosts(catalog, history, 4);
    setPosts(local);

    void fetch("/api/blog/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history, limit: 4 }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { posts?: BlogPost[] } | null) => {
        if (body?.posts?.length) {
          const slugs = new Set(body.posts.map((post) => post.slug));
          const hydrated = body.posts
            .map((item) => catalog.find((entry) => entry.slug === item.slug))
            .filter((entry): entry is BlogPost => Boolean(entry));
          if (hydrated.length > 0 && hydrated.every((entry) => slugs.has(entry.slug))) {
            setPosts(hydrated);
          }
        }
      })
      .catch(() => {
        // local fallback already set
      });
  }, [catalog]);

  const visiblePosts = useMemo(() => posts.slice(0, 4), [posts]);

  if (visiblePosts.length === 0) return null;

  return (
    <section className={cn(className)} aria-labelledby="blog-personalized-title">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-sky" aria-hidden />
        <h2 id="blog-personalized-title" className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
          Для вас
        </h2>
      </div>
      <p className="mt-1 text-sm text-slate">На основе недавно прочитанных материалов</p>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">
        {visiblePosts.map((post) => (
          <li key={post.id}>
            <BlogCard post={post} variant="standard" />
          </li>
        ))}
      </ul>
      <Link href="/blog#blog-catalog" className="mt-4 inline-block text-sm font-semibold text-sky hover:underline">
        Смотреть весь каталог
      </Link>
    </section>
  );
}
