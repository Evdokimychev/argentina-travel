import { NextResponse } from "next/server";
import { blogPosts } from "@/data/blog";
import { suggestBlogAiLinks } from "@/lib/blog-ai-link-suggestions";
import { suggestBlogPostInternalLinks } from "@/lib/blog-internal-link-suggestions";
import { resolveBlogCatalog } from "@/lib/cms/blog-resolver";
import { filterIndexableBlogPosts } from "@/lib/blog-utils";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { getServerI18nLocale } from "@/lib/i18n/server-locale";

type LinkSuggestionsBody = {
  text?: string;
  slug?: string;
  excerpt?: string;
  sections?: Array<{ title?: string; body?: string }>;
  content?: string;
};

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) {
    return auth.response;
  }

  const ip = getClientIp(request);
  const limit = await checkRateLimit(`cms-blog-links:ip:${ip}`, 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов. Повторите позже." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  try {
    const body = (await request.json()) as LinkSuggestionsBody;
    const locale = await getServerI18nLocale();
    let catalog = filterIndexableBlogPosts(await resolveBlogCatalog(locale));
    if (catalog.length === 0) {
      catalog = filterIndexableBlogPosts(blogPosts);
    }

    const textParts = [
      body.text ?? "",
      body.excerpt ?? "",
      body.content ?? "",
      ...(body.sections ?? []).flatMap((section) => [section.title ?? "", section.body ?? ""]),
    ].filter(Boolean);

    const combinedText = textParts.join("\n\n");
    const ruleBased = suggestBlogPostInternalLinks({
      excerpt: body.excerpt,
      sections: body.sections,
      content: body.content ?? body.text,
    });

    const aiSuggestions = await suggestBlogAiLinks({
      text: combinedText,
      currentSlug: body.slug,
      catalog,
      limit: 5,
    });

    return NextResponse.json({
      ruleBased,
      aiSuggestions,
      aiEnabled: Boolean(process.env.OPENAI_API_KEY?.trim()),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
