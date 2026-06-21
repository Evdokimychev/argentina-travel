import Image from "next/image";
import Link from "next/link";
import { Clock, Eye, UserRound } from "lucide-react";
import BlogSidebar from "@/components/blog/BlogSidebar";
import BlogRichArticle from "@/components/blog/BlogRichArticle";
import ContentReadingLayout from "@/components/content/ContentReadingLayout";
import SharePageLinkButton from "@/components/content/SharePageLinkButton";
import { BLOG_EDITORIAL } from "@/data/blog-author";
import { getBlogRichArticle, getBlogRichArticleToc } from "@/data/blog-articles";
import {
  blogPosts,
  formatBlogViews,
  formatDate,
  sortBlogPostsByDate,
} from "@/data/blog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { buildTocItemsFromHeadings, headingToAnchorId } from "@/lib/content-heading-id";
import { mapBlogRelatedResources } from "@/lib/content-related-links";
import { siteContainerClass, siteScrollAnchorClass } from "@/lib/site-container";
import TourEmbedSection from "@/components/embed/TourEmbedSection";
import type { BlogPost, TourListing } from "@/types";

type BlogPostViewProps = {
  post: BlogPost;
  initialTours?: TourListing[];
};

export default function BlogPostView({ post, initialTours = [] }: BlogPostViewProps) {
  const richArticle = post.richArticleId
    ? getBlogRichArticle(post.richArticleId)
    : undefined;

  const freshPosts = sortBlogPostsByDate(blogPosts)
    .filter((p) => p.slug !== post.slug)
    .slice(0, 4);

  const paragraphs = post.content
    .split(/(?<=[.!?])\s+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const sectionParagraphs = (body: string) =>
    body
      .split(/(?<=[.!?])\s+/)
      .map((p) => p.trim())
      .filter(Boolean);

  const usedIds = new Set<string>();
  const sectionsWithIds = (post.sections ?? []).map((section) => ({
    section,
    headingId: headingToAnchorId(section.title, usedIds),
  }));
  const tocItems = richArticle
    ? getBlogRichArticleToc(richArticle.id).map((item) => ({
        id: item.id,
        label: item.label,
        level: 2 as const,
      }))
    : buildTocItemsFromHeadings(
        sectionsWithIds.map(({ section }) => ({ heading: section.title }))
      );

  return (
    <>
      <section
        data-scroll-rail-tone="light"
        className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-surface-muted via-white to-sky/[0.06]"
      >
        <div className={cn(siteContainerClass, "relative py-8 md:py-10")}>
          <nav className="text-sm text-slate">
            <Link href="/" className="hover:text-sky">
              Главная
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <Link href="/blog" className="hover:text-sky">
              Блог
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-charcoal">{post.category}</span>
          </nav>

          <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <span className="inline-flex rounded-full border border-sky/15 bg-sky/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky">
                    {post.category}
                  </span>
                  <h1 className="mt-4 font-display text-3xl font-bold leading-[1.12] tracking-tight text-charcoal sm:text-4xl lg:text-[2.5rem]">
                    {post.title}
                  </h1>
                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate sm:text-lg">
                    {post.excerpt}
                  </p>
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
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-4 w-4" aria-hidden />
                  {formatBlogViews(post.views)} просмотров
                </span>
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

            <div className="relative overflow-hidden rounded-2xl bg-charcoal/5 shadow-card ring-1 ring-gray-100">
              <div className="relative aspect-[16/10] w-full">
                <Image src={post.image} alt={post.title} fill priority className="object-cover" sizes="360px" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="bg-surface-muted pb-16">
        <div className={cn(siteContainerClass, "py-8 md:py-10")}>
          <ContentReadingLayout
            tocItems={tocItems}
            aside={<BlogSidebar freshPosts={freshPosts} embedded />}
            relatedItems={
              post.relatedResources?.length
                ? mapBlogRelatedResources(post.relatedResources)
                : []
            }
            articleClassName="content-reading-prose--wide"
            footer={
              <footer className="flex flex-wrap items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky/10 text-sm font-bold text-sky">
                  {post.author.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-charcoal">{post.author}</p>
                  <p className="text-sm text-slate">{post.authorBio ?? BLOG_EDITORIAL.bio}</p>
                </div>
              </footer>
            }
          >
            <div className="space-y-4">
              {richArticle ? (
                <BlogRichArticle article={richArticle} />
              ) : post.sections?.length ? (
                sectionsWithIds.map(({ section, headingId }) => (
                  <section key={section.title} className="space-y-3">
                    <h2
                      id={headingId}
                      className={cn(
                        "font-heading text-xl font-bold text-charcoal",
                        siteScrollAnchorClass
                      )}
                    >
                      {section.title}
                    </h2>
                    {sectionParagraphs(section.body).map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </section>
                ))
              ) : (
                paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
              )}
            </div>

            {post.tourEmbeds?.length && initialTours.length > 0 ? (
              <div className="mt-10 space-y-8 border-t border-gray-100 pt-8">
                {post.tourEmbeds.map((embed) => (
                  <TourEmbedSection
                    key={embed.id ?? `${embed.variant}-${embed.title}`}
                    config={{ ...embed, tone: embed.tone ?? "inline" }}
                    initialTours={initialTours}
                  />
                ))}
              </div>
            ) : null}
          </ContentReadingLayout>

          <div className="mt-8 rounded-3xl border border-sky/15 bg-gradient-to-br from-sky/[0.06] to-white p-6 text-center shadow-card sm:p-8">
            <p className="font-heading text-xl font-bold text-charcoal">Планируете поездку?</p>
            <p className="mt-2 text-sm text-slate">
              {post.tourEmbeds?.length
                ? "Дополните маршрут материалами путеводителя или напишите нам"
                : "Соберите маршрут в путеводителе или выберите готовый тур с гидом"}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/guide" className={cn(buttonVariants(), "rounded-full px-6")}>
                Путеводитель
              </Link>
              {!post.tourEmbeds?.length ? (
                <Link href="/tours" className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-6")}>
                  Каталог туров
                </Link>
              ) : null}
              <Link href="/contacts" className={cn(buttonVariants({ variant: "ghost" }), "rounded-full px-6")}>
                Контакты
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
