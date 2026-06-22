import Link from "next/link";
import { Clock, UserRound } from "lucide-react";
import BlogPostBreadcrumbs from "@/components/blog/BlogPostBreadcrumbs";
import BlogPostHeroImage from "@/components/blog/BlogPostHeroImage";
import SharePageLinkButton from "@/components/content/SharePageLinkButton";
import { formatDate, formatBlogUpdatedLabel } from "@/data/blog";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";
import type { BlogUiBreadcrumbItem } from "@/lib/blog-breadcrumbs";
import type { BlogPost } from "@/types";

type BlogPostHeaderProps = {
  post: BlogPost;
  breadcrumbs: BlogUiBreadcrumbItem[];
  className?: string;
};

export default function BlogPostHeader({ post, breadcrumbs, className }: BlogPostHeaderProps) {
  return (
    <section
      data-scroll-rail-tone="light"
      className={cn(
        "relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-surface-muted via-white to-sky/[0.06]",
        className
      )}
    >
      <div className={cn(siteContainerClass, "relative py-8 md:py-10")}>
        <BlogPostBreadcrumbs items={breadcrumbs} />

        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_min(100%,380px)] lg:gap-10">
          <div className="min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-full border border-sky/15 bg-sky/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky">
                    {post.category}
                  </span>
                  {post.richArticleId ? (
                    <span className="inline-flex rounded-full bg-sky px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                      Полный гид
                    </span>
                  ) : null}
                </div>
                <h1
                  data-speakable="headline"
                  className="mt-4 font-display text-3xl font-bold leading-[1.12] tracking-tight text-charcoal sm:text-4xl lg:text-[2.5rem]"
                >
                  {post.title}
                </h1>
                <div className="mt-4 max-w-2xl rounded-xl border border-gray-200/80 bg-white/70 px-4 py-3.5 shadow-sm backdrop-blur-sm sm:px-5 sm:py-4">
                  <p
                    data-speakable="lede"
                    className="text-base leading-[1.7] text-slate sm:text-lg"
                  >
                    {post.excerpt}
                  </p>
                </div>
              </div>
              <SharePageLinkButton title={post.title} className="shrink-0" />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate">
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="h-4 w-4 text-sky/70" aria-hidden />
                {post.author}
              </span>
              <span aria-hidden>·</span>
              <span>{formatDate(post.date)}</span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" aria-hidden />
                {post.readTime}
              </span>
              {!post.noIndex ? (
                <>
                  <span aria-hidden>·</span>
                  <span>{formatBlogUpdatedLabel(post)}</span>
                </>
              ) : null}
            </div>

            <ul className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-slate"
                >
                  #{tag}
                </li>
              ))}
            </ul>
          </div>

          <BlogPostHeroImage post={post} className="hidden lg:block" />
        </div>

        <BlogPostHeroImage post={post} className="mt-6 lg:hidden" />
      </div>
    </section>
  );
}
