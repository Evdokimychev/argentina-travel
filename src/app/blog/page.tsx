import { cookies } from "next/headers";
import BlogIndexView from "@/components/blog/BlogIndexView";
import BlogIndexHero from "@/components/blog/BlogIndexHero";
import { resolveBlogCatalog } from "@/lib/cms/blog-resolver";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { getServerPersonalizedBlogPosts } from "@/lib/blog-analytics-signals";
import { filterIndexableBlogPosts } from "@/lib/blog-utils";
import { parseBlogReadingHistoryCookie, BLOG_READING_HISTORY_COOKIE } from "@/lib/blog-reading-history-cookie";
import {
  BLOG_HERO_VARIANT_COOKIE,
  resolveBlogHeroVariantFromCookie,
} from "@/lib/blog-hero-variant-cookie";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
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

  const heroVariantCookie = cookieStore.get(BLOG_HERO_VARIANT_COOKIE)?.value;
  const heroVariant = resolveBlogHeroVariantFromCookie(
    heroVariantCookie,
    cookieStore.get("ga-session-id")?.value ?? "blog-index",
  );
  if (!heroVariantCookie) {
    cookieStore.set(BLOG_HERO_VARIANT_COOKIE, heroVariant, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  let initialPersonalized: typeof indexable = [];
  if (isSupabaseAuthEnabled()) {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);
    initialPersonalized = await getServerPersonalizedBlogPosts(
      supabase,
      indexable,
      history,
      sessionUser?.id ?? null,
      4,
    );
  } else {
    const { getPersonalizedBlogPosts } = await import("@/lib/blog-personalized");
    initialPersonalized = getPersonalizedBlogPosts(indexable, history, 4);
  }

  return (
    <>
      <BlogIndexHero variant={heroVariant} indexablePostsCount={indexable.length} />
      <BlogIndexView
        posts={posts}
        initialTours={initialTours}
        initialPersonalizedPosts={initialPersonalized}
        heroVariant={heroVariant}
      />
    </>
  );
}
