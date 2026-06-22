import { NextResponse } from "next/server";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import {
  createBlogArticleComment,
  listBlogArticleComments,
} from "@/lib/blog-comments-server";
import { parseBlogCommentBody, parseBlogCommentSlug } from "@/lib/blog-comments-parsers";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CommentBody = {
  slug?: string;
  body?: string;
  parentId?: string | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = parseBlogCommentSlug(searchParams.get("slug"));

  if (!slug) {
    return NextResponse.json({ error: "Передайте slug статьи" }, { status: 400 });
  }

  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ comments: [] });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const comments = await listBlogArticleComments(supabase, slug, user?.id ?? null);
    return NextResponse.json({ comments });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ error: "Комментарии недоступны" }, { status: 503 });
  }

  const ip = getClientIp(request);
  const limit = await checkRateLimit(`blog-comment:ip:${ip}`, 15, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Слишком много комментариев. Повторите позже." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Войдите в аккаунт, чтобы комментировать" }, { status: 401 });
    }

    const userLimit = await checkRateLimit(`blog-comment:user:${user.id}`, 20, 3_600_000);
    if (!userLimit.ok) {
      return NextResponse.json(
        { error: "Слишком много комментариев. Повторите позже." },
        { status: 429, headers: { "Retry-After": String(userLimit.retryAfterSec) } },
      );
    }

    const body = (await request.json()) as CommentBody;
    const slug = parseBlogCommentSlug(body.slug);
    const commentBody = parseBlogCommentBody(body.body);

    if (!slug || !commentBody) {
      return NextResponse.json({ error: "Передайте slug и текст комментария" }, { status: 400 });
    }

    const result = await createBlogArticleComment(supabase, {
      articleSlug: slug,
      userId: user.id,
      body: commentBody,
      parentId: typeof body.parentId === "string" ? body.parentId : null,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ comment: result.comment }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
