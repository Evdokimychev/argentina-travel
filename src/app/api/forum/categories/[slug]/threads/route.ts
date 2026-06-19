import { NextResponse } from "next/server";
import { isSupabaseForumEnabled } from "@/lib/auth-mode";
import {
  createForumThread,
  fetchForumThreadsByCategorySlug,
} from "@/lib/forum/forum-server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  if (!isSupabaseForumEnabled()) {
    return NextResponse.json({ error: "Форум недоступен" }, { status: 503 });
  }

  const { slug } = await context.params;

  try {
    const supabase = await createSupabaseServerClient();
    const result = await fetchForumThreadsByCategorySlug(supabase, slug);

    if (!result) {
      return NextResponse.json({ error: "Раздел не найден" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

type PostBody = {
  title?: string;
  body?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  if (!isSupabaseForumEnabled()) {
    return NextResponse.json({ error: "Форум недоступен" }, { status: 503 });
  }

  const ip = getClientIp(request);
  const limit = await checkRateLimit(`forum-thread:ip:${ip}`, 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Слишком много новых тем. Повторите позже." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const { slug } = await context.params;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Войдите в аккаунт, чтобы создать тему" }, { status: 401 });
    }

    const userLimit = await checkRateLimit(`forum-thread:user:${user.id}`, 10, 3_600_000);
    if (!userLimit.ok) {
      return NextResponse.json(
        { error: "Слишком много новых тем. Повторите позже." },
        { status: 429, headers: { "Retry-After": String(userLimit.retryAfterSec) } }
      );
    }

    const body = (await request.json()) as PostBody;
    const result = await createForumThread(supabase, {
      categorySlug: slug,
      authorId: user.id,
      title: body.title ?? "",
      body: body.body ?? "",
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ thread: result.thread }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
