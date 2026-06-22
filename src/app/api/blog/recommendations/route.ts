import { resolveBlogCatalog } from "@/lib/cms/blog-resolver";
import { getPersonalizedBlogPosts } from "@/lib/blog-personalized";
import { filterIndexableBlogPosts } from "@/lib/blog-utils";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import type { BlogReadingHistoryEntry } from "@/lib/blog-reading-history";

type RecommendationsBody = {
  history?: Array<{ slug: string; title: string; category?: string }>;
  limit?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RecommendationsBody;
    const locale = await getServerI18nLocale();
    const catalog = filterIndexableBlogPosts(await resolveBlogCatalog(locale));
    const limit = Math.min(Math.max(body.limit ?? 4, 1), 8);

    const history: BlogReadingHistoryEntry[] = (body.history ?? []).map((entry) => ({
      slug: entry.slug,
      title: entry.title,
      category: entry.category,
      readAt: new Date().toISOString(),
    }));

    const posts = getPersonalizedBlogPosts(catalog, history, limit);

    return Response.json({
      posts: posts.map((post) => ({
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        category: post.category,
        image: post.image,
        date: post.date,
        readTime: post.readTime,
      })),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
