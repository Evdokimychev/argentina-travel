import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { getServerPersonalizedBlogPosts } from "@/lib/blog-analytics-signals";
import { resolveBlogCatalog } from "@/lib/cms/blog-resolver";
import { filterIndexableBlogPosts } from "@/lib/blog-utils";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import type { BlogReadingHistoryEntry } from "@/lib/blog-reading-history";

type RecommendationsBody = {
  history?: Array<{ slug: string; title: string; category?: string; readAt?: string }>;
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
      readAt: entry.readAt ?? new Date().toISOString(),
    }));

    let posts: typeof catalog = [];

    if (isSupabaseAuthEnabled()) {
      const supabase = await createSupabaseServerClient();
      const sessionUser = await loadSessionUserFromSupabase(supabase);
      posts = await getServerPersonalizedBlogPosts(
        supabase,
        catalog,
        history,
        sessionUser?.id ?? null,
        limit,
      );
    } else {
      const { getPersonalizedBlogPosts } = await import("@/lib/blog-personalized");
      posts = getPersonalizedBlogPosts(catalog, history, limit);
    }

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
