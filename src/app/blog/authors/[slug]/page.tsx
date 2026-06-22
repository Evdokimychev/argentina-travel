import { notFound } from "next/navigation";
import Link from "next/link";
import BlogCard from "@/components/blog/BlogCard";
import PageBreadcrumbs from "@/components/navigation/PageBreadcrumbs";
import { blogPosts } from "@/data/blog";
import { resolveBlogCatalog } from "@/lib/cms/blog-resolver";
import {
  buildBlogAuthorProfiles,
  getBlogAuthorProfile,
  getBlogPostsByAuthorSlug,
} from "@/lib/blog-authors";
import { filterIndexableBlogPosts } from "@/lib/blog-utils";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";

interface BlogAuthorPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const locale = "ru";
  let catalog = filterIndexableBlogPosts(blogPosts);
  try {
    catalog = filterIndexableBlogPosts(await resolveBlogCatalog(locale));
  } catch {
    // TS fallback
  }
  return buildBlogAuthorProfiles(catalog).map((author) => ({ slug: author.slug }));
}

export async function generateMetadata({ params }: BlogAuthorPageProps) {
  const { slug } = await params;
  const locale = await getServerI18nLocale();
  const catalog = filterIndexableBlogPosts(await resolveBlogCatalog(locale));
  const author = getBlogAuthorProfile(slug, catalog);
  if (!author) return { title: "Автор не найден" };

  return {
    ...buildPublicPageMetadata({
      title: `${author.name} — блог «Пора в Аргентину»`,
      description: author.bio ?? `Материалы автора ${author.name} в журнале о путешествиях по Аргентине.`,
      path: `/blog/authors/${slug}`,
      image: author.avatar,
    }),
    alternates: buildHreflangAlternates(`/blog/authors/${slug}`),
  };
}

export default async function BlogAuthorPage({ params }: BlogAuthorPageProps) {
  const { slug } = await params;
  const locale = await getServerI18nLocale();
  const catalog = filterIndexableBlogPosts(await resolveBlogCatalog(locale));
  const author = getBlogAuthorProfile(slug, catalog);
  if (!author) notFound();

  const posts = getBlogPostsByAuthorSlug(slug, catalog);

  return (
    <div className="bg-surface-muted pb-16">
      <div className={cn(siteContainerClass, "py-8 md:py-10")}>
        <PageBreadcrumbs
          items={[
            { label: "Главная", href: "/" },
            { label: "Блог", href: "/blog" },
            { label: "Авторы", href: "/blog/authors" },
            { label: author.name },
          ]}
        />

        <header className="mt-8 max-w-2xl">
          <h1 className="font-heading text-3xl font-bold text-charcoal sm:text-4xl">{author.name}</h1>
          {author.bio ? (
            <p className="mt-3 text-sm leading-relaxed text-slate sm:text-base">{author.bio}</p>
          ) : null}
          <p className="mt-2 text-xs text-slate">
            {author.postCount}{" "}
            {author.postCount === 1 ? "материал" : author.postCount < 5 ? "материала" : "материалов"}
          </p>
        </header>

        {posts.length > 0 ? (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.id}>
                <BlogCard post={post} variant="standard" />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 text-sm text-slate">Пока нет опубликованных материалов.</p>
        )}

        <Link href="/blog/authors" className="mt-10 inline-block text-sm font-semibold text-sky hover:underline">
          ← Все авторы
        </Link>
      </div>
    </div>
  );
}
