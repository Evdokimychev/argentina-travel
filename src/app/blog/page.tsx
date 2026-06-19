import BlogIndexView from "@/components/blog/BlogIndexView";
import { resolveBlogCatalog } from "@/lib/cms/blog-resolver";
import { buildHreflangAlternates } from "@/lib/i18n/hreflang";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { buildPublicPageMetadata } from "@/lib/page-metadata";

const PAGE_TITLE = "Блог — советы и маршруты по Аргентине";
const PAGE_DESCRIPTION =
  "Редакционные материалы и тематический каталог: Патагония, Буэнос-Айрес, визы, деньги, треккинг, вино и маршруты на 7–14 дней.";

export const metadata = {
  ...buildPublicPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: "/blog",
  }),
  alternates: buildHreflangAlternates("/blog"),
};

export default async function BlogPage() {
  const locale = await getServerI18nLocale();
  const posts = await resolveBlogCatalog(locale);
  return <BlogIndexView posts={posts} />;
}
