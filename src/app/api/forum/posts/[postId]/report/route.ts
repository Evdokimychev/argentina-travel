import { NextResponse } from "next/server";
import { isSupabaseForumEnabled } from "@/lib/auth-mode";
import { submitForumPostReport } from "@/lib/forum/forum-server";
import { FORUM_REPORT_REASONS, type ForumReportReason } from "@/lib/forum/forum-types";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PostBody = {
  reason?: string;
  details?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ postId: string }> }
) {
  if (!isSupabaseForumEnabled()) {
    return NextResponse.json({ error: "Форум недоступен" }, { status: 503 });
  }

  const ip = getClientIp(request);
  const limit = await checkRateLimit(`forum-report:ip:${ip}`, 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Слишком много жалоб. Повторите позже." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const { postId } = await context.params;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });
    }

    const body = (await request.json()) as PostBody;
    const reason = body.reason?.trim() as ForumReportReason | undefined;

    if (!reason || !FORUM_REPORT_REASONS.includes(reason)) {
      return NextResponse.json({ error: "Укажите причину жалобы" }, { status: 400 });
    }

    const result = await submitForumPostReport(supabase, {
      postId,
      reporterUserId: user.id,
      reason,
      details: body.details,
    });

    if ("error" in result) {
      const status = result.error.includes("уже") ? 409 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({ ok: true, reportId: result.reportId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
