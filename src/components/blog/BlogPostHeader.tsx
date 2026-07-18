import { Clock, UserRound } from "lucide-react";
import BlogPostBreadcrumbs from "@/components/blog/BlogPostBreadcrumbs";
import BlogPostHeroImage from "@/components/blog/BlogPostHeroImage";
import SharePageLinkButton from "@/components/content/SharePageLinkButton";
import { formatBlogDate, formatBlogUpdatedLabel } from "@/lib/blog-utils";
import { cn } from "@/lib/cn";
import { resolveBlogEditorialTheme } from "@/lib/editorial-theme";
import { siteContainerClass } from "@/lib/site-container";
import type { BlogUiBreadcrumbItem } from "@/lib/blog-breadcrumbs";
import type { BlogPost } from "@/types";

type BlogPostHeaderProps = {
  post: BlogPost;
  breadcrumbs: BlogUiBreadcrumbItem[];
  className?: string;
};

export default function BlogPostHeader({ post, breadcrumbs, className }: BlogPostHeaderProps) {
  const editorialTheme = resolveBlogEditorialTheme(post);

  return (
    <section
      data-scroll-rail-tone="light"
      data-editorial-theme={editorialTheme}
      className={cn(
        "editorial-hero relative overflow-hidden border-b border-[var(--editorial-line)]",
        className
      )}
    >
      <div className={cn(siteContainerClass, "relative py-8 md:py-10 lg:py-12")}>
        <BlogPostBreadcrumbs items={breadcrumbs} />

        <div className="mt-5 grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_min(42%,460px)] lg:gap-10">
          <div className="min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="editorial-kicker inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]">
                    {post.category}
                  </span>
                  {post.richArticleId ? (
                    <span className="inline-flex rounded-full bg-[var(--editorial-accent-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                      Полный гид
                    </span>
                  ) : null}
                </div>
                <div className="editorial-rule mt-4 h-1 w-12 rounded-full" aria-hidden />
                <h1
                  data-speakable="headline"
                  className="mt-3 font-display text-3xl font-bold leading-[1.08] tracking-[-0.035em] text-charcoal sm:text-4xl lg:text-[2.85rem]"
                >
                  {post.title}
                </h1>
                <div className="mt-4 max-w-2xl border-l-2 border-[var(--editorial-accent)] pl-4 sm:pl-5">
                  <p
                    data-speakable="lede"
                    className="font-editorial text-base leading-relaxed text-slate sm:text-lg"
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
              <span>{formatBlogDate(post.date)}</span>
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

          <BlogPostHeroImage post={post} className="editorial-media-frame hidden rounded-[1.75rem] border-[var(--editorial-line)] lg:block" />
        </div>

        <BlogPostHeroImage post={post} className="mt-5 lg:hidden [&>div]:aspect-[16/9]" />
      </div>
    </section>
  );
}
