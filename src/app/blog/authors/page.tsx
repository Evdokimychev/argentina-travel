import Link from "next/link";
import BlogAuthorsGrid, { BlogEditorialLeadCard } from "@/components/blog/BlogAuthorsGrid";
import PageBreadcrumbs from "@/components/navigation/PageBreadcrumbs";
import { resolveBlogCatalog } from "@/lib/cms/blog-resolver";
import { buildBlogAuthorProfiles } from "@/lib/blog-authors";
import { filterIndexableBlogPosts } from "@/lib/blog-utils";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { buildPublicPageMetadata } from "@/lib/page-metadata";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";

export const metadata = {
  ...buildPublicPageMetadata({
    title: "Авторы журнала — блог «Пора в Аргентину»",
    description: "Редакция и авторы материалов о путешествиях, маршрутах и жизни в Аргентине.",
    path: "/blog/authors",
  }),
  alternates: buildHreflangAlternates("/blog/authors"),
};

export default async function BlogAuthorsPage() {
  const locale = await getServerI18nLocale();
  const catalog = filterIndexableBlogPosts(await resolveBlogCatalog(locale));
  const authors = buildBlogAuthorProfiles(catalog);

  return (
    <div className="bg-surface-muted pb-16">
      <div className={cn(siteContainerClass, "py-8 md:py-10")}>
        <PageBreadcrumbs
          items={[
            { label: "Главная", href: "/" },
            { label: "Блог", href: "/blog" },
            { label: "Авторы" },
          ]}
        />

        <header className="mt-8 max-w-2xl">
          <h1 className="font-heading text-3xl font-bold text-charcoal sm:text-4xl">Авторы журнала</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate sm:text-base">
            Материалы готовит редакция платформы и приглашённые эксперты. Выберите автора, чтобы
            открыть его архив.
          </p>
        </header>

        <BlogEditorialLeadCard className="mt-8" />
        <BlogAuthorsGrid authors={authors} className="mt-8" />

        <p className="mt-10 text-sm text-slate">
          <Link href="/blog/feed.xml" className="font-medium text-sky hover:underline">
            RSS-лента журнала
          </Link>
        </p>
      </div>
    </div>
  );
}
