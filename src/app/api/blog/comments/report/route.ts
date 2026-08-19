import { NextResponse } from "next/server";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { createBlogCommentReport } from "@/lib/blog-comments-server";
import {
  BLOG_COMMENT_REPORT_REASON_LABELS,
  type BlogCommentReportReason,
} from "@/lib/blog-comments-types";
import { isPublicPathEnabled } from "@/lib/public-module-visibility";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { fetchSiteModules, fetchSiteNavigation } from "@/lib/site-settings-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { unexpectedPublicApiError } from "@/lib/public-api/safe-error";

type ReportBody = {
  commentId?: string;
  reason?: string;
  details?: string;
};

export async function POST(request: Request) {
  const [navigation, modules] = await Promise.all([fetchSiteNavigation(), fetchSiteModules()]);
  if (!isPublicPathEnabled("/blog", navigation, modules)) {
    return NextResponse.json({ error: "Блог отключён" }, { status: 404 });
  }

  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json({ error: "Жалобы недоступны" }, { status: 503 });
  }

  const ip = getClientIp(request);
  const limit = await checkRateLimit(`blog-comment-report:ip:${ip}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов. Повторите позже." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Войдите в аккаунт" }, { status: 401 });
    }

    const body = (await request.json()) as ReportBody;
    const commentId = typeof body.commentId === "string" ? body.commentId.trim() : "";
    const reason = body.reason as BlogCommentReportReason;

    if (!commentId || !BLOG_COMMENT_REPORT_REASON_LABELS[reason]) {
      return NextResponse.json({ error: "Передайте commentId и reason" }, { status: 400 });
    }

    const result = await createBlogCommentReport(supabase, {
      commentId,
      reporterUserId: user.id,
      reason,
      details: body.details,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(unexpectedPublicApiError(), { status: 500 });
  }
}
