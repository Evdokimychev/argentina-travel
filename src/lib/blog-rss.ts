import { absoluteUrl } from "@/lib/site-url";
import type { BlogPost } from "@/types";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildBlogRssFeed(posts: BlogPost[]): string {
  const items = posts
    .slice(0, 40)
    .map((post) => {
      const link = absoluteUrl(`/blog/${post.slug}`);
      const pubDate = new Date(post.dateModified ?? post.date).toUTCString();
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <category>${escapeXml(post.category)}</category>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Журнал «Пора в Аргентину»</title>
    <link>${absoluteUrl("/blog")}</link>
    <description>Статьи о путешествиях, маршрутах и жизни в Аргентине</description>
    <language>ru</language>
    <atom:link href="${absoluteUrl("/blog/feed.xml")}" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
}
