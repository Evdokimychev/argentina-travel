import { NextResponse } from "next/server";
import { isSupabaseForumEnabled } from "@/lib/auth-mode";
import { fetchForumThreadDetail } from "@/lib/forum/forum-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ threadId: string }> }
) {
  if (!isSupabaseForumEnabled()) {
    return NextResponse.json({ error: "Форум недоступен" }, { status: 503 });
  }

  const { threadId } = await context.params;
  const categorySlug = new URL(request.url).searchParams.get("category");

  if (!categorySlug) {
    return NextResponse.json({ error: "Укажите раздел (category)" }, { status: 400 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const thread = await fetchForumThreadDetail(supabase, categorySlug, threadId);

    if (!thread) {
      return NextResponse.json({ error: "Тема не найдена" }, { status: 404 });
    }

    return NextResponse.json({ thread });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
