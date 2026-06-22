import { cookies } from "next/headers";
import BlogIndexView from "@/components/blog/BlogIndexView";
import { resolveBlogCatalog } from "@/lib/cms/blog-resolver";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { getPersonalizedBlogPosts } from "@/lib/blog-personalized";
import { filterIndexableBlogPosts } from "@/lib/blog-utils";
import { parseBlogReadingHistoryCookie, BLOG_READING_HISTORY_COOKIE } from "@/lib/blog-reading-history-cookie";
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
  alternates: {
    ...buildHreflangAlternates("/blog"),
    types: {
      "application/rss+xml": [{ url: "/blog/feed.xml", title: "RSS — журнал «Пора в Аргентину»" }],
    },
  },
};

export default async function BlogPage() {
  const locale = await getServerI18nLocale();
  const cookieStore = await cookies();
  const history = parseBlogReadingHistoryCookie(cookieStore.get(BLOG_READING_HISTORY_COOKIE)?.value);
  const [posts, initialTours] = await Promise.all([
    resolveBlogCatalog(locale),
    fetchMarketplaceTours(),
  ]);
  const indexable = filterIndexableBlogPosts(posts);
  const initialPersonalized = getPersonalizedBlogPosts(indexable, history, 4);

  return (
    <BlogIndexView
      posts={posts}
      initialTours={initialTours}
      initialPersonalizedPosts={initialPersonalized}
    />
  );
}
