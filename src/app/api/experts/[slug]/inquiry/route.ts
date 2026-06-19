import { NextResponse } from "next/server";
import { createExpertInquiry } from "@/lib/expert-inquiries-server";
import { fetchExpertBySlug } from "@/lib/local-experts-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json(
      { error: "Обращения доступны после настройки Supabase" },
      { status: 503 }
    );
  }

  try {
    const { slug } = await context.params;
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (!sessionUser) {
      return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });
    }

    const expert = await fetchExpertBySlug(supabase, slug);
    if (!expert || expert.status !== "published") {
      return NextResponse.json({ error: "Эксперт не найден" }, { status: 404 });
    }

    const body = (await request.json()) as { message?: string };
    const message = typeof body.message === "string" ? body.message : "";

    const result = await createExpertInquiry({
      supabase,
      expert,
      userId: sessionUser.id,
      message,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      inquiry: result.inquiry,
      threadId: result.threadId,
      messageHref: result.threadId
        ? `/profile/messages?thread=${encodeURIComponent(result.threadId)}`
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
