import { NextResponse } from "next/server";
import { isSupabaseForumEnabled } from "@/lib/auth-mode";
import { createForumPost } from "@/lib/forum/forum-server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PostBody = {
  body?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ threadId: string }> }
) {
  if (!isSupabaseForumEnabled()) {
    return NextResponse.json({ error: "Форум недоступен" }, { status: 503 });
  }

  const ip = getClientIp(request);
  const limit = await checkRateLimit(`forum-post:ip:${ip}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Слишком много сообщений. Повторите позже." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const { threadId } = await context.params;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Войдите в аккаунт, чтобы ответить" }, { status: 401 });
    }

    const userLimit = await checkRateLimit(`forum-post:user:${user.id}`, 30, 3_600_000);
    if (!userLimit.ok) {
      return NextResponse.json(
        { error: "Слишком много сообщений. Повторите позже." },
        { status: 429, headers: { "Retry-After": String(userLimit.retryAfterSec) } }
      );
    }

    const body = (await request.json()) as PostBody;
    const result = await createForumPost(supabase, {
      threadId,
      authorId: user.id,
      body: body.body ?? "",
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      { post: result.post, categorySlug: result.categorySlug },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
