"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import BlogCard from "@/components/blog/BlogCard";
import {
  BLOG_HUBS,
  blogHubPath,
  countBlogHubPosts,
  getBlogHubPreviewPosts,
} from "@/data/blog-hubs";
import type { BlogPost } from "@/types";
import { cn } from "@/lib/cn";

type BlogEditorialHubsProps = {
  posts: BlogPost[];
  className?: string;
};

export default function BlogEditorialHubs({ posts, className }: BlogEditorialHubsProps) {
  return (
    <section className={className} aria-labelledby="blog-editorial-hubs-title">
      <div>
        <h2 id="blog-editorial-hubs-title" className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
          Тематические подборки
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-slate">
          Редакционные витрины — лучшие материалы по регионам и темам
        </p>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        {BLOG_HUBS.map((hub) => {
          const previewPosts = getBlogHubPreviewPosts(hub, posts);
          const total = countBlogHubPosts(hub, posts);
          if (previewPosts.length === 0) return null;

          return (
            <article
              key={hub.id}
              className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-card"
            >
              <div className="relative flex min-h-[120px] items-end overflow-hidden sm:min-h-[140px]">
                <Image
                  src={hub.image}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/35 to-transparent" />
                <div className="relative w-full p-4 sm:p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                    {total} {total === 1 ? "статья" : total < 5 ? "статьи" : "статей"}
                  </p>
                  <h3 className="mt-1 font-heading text-lg font-bold text-white sm:text-xl">{hub.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-white/90">{hub.description}</p>
                </div>
              </div>

              <ul className="divide-y divide-gray-100 p-2 sm:p-3">
                {previewPosts.map((post) => (
                  <li key={post.id}>
                    <BlogCard post={post} variant="compact" />
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 sm:px-5">
                <Link
                  href={blogHubPath(hub.id)}
                  className={cn(
                    "blog-touch-target inline-flex items-center gap-1 text-sm font-semibold text-sky hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40 focus-visible:ring-offset-2",
                  )}
                >
                  Все материалы
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                {hub.cta ? (
                  <Link href={hub.cta.href} className="text-sm text-slate hover:text-sky">
                    {hub.cta.label}
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
