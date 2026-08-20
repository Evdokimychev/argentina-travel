import { NextResponse } from "next/server";
import { isSupabaseForumEnabled } from "@/lib/auth-mode";
import { fetchForumThreadDetail } from "@/lib/forum/forum-server";
import { rejectIfPublicModuleQuarantined } from "@/lib/modules/dormant-quarantine";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { unexpectedPublicApiError } from "@/lib/public-api/safe-error";

export async function GET(
  request: Request,
  context: { params: Promise<{ threadId: string }> }
) {
  const quarantined = await rejectIfPublicModuleQuarantined("/forum", { labelRu: "Форум" });
  if (quarantined) return quarantined;

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
  } catch {
    return NextResponse.json(unexpectedPublicApiError(), { status: 500 });
  }
}
