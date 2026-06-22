import { NextResponse } from "next/server";
import { resolveBlogCatalog } from "@/lib/cms/blog-resolver";
import { buildBlogRssFeed } from "@/lib/blog-rss";
import { filterIndexableBlogPosts, sortBlogPostsByDate } from "@/lib/blog-utils";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";

export const revalidate = 3600;

export async function GET() {
  const locale = await getServerI18nLocale();
  const catalog = await resolveBlogCatalog(locale);
  const posts = sortBlogPostsByDate(filterIndexableBlogPosts(catalog));

  return new Response(buildBlogRssFeed(posts), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
