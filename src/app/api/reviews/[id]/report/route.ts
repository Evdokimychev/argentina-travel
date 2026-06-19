import { NextResponse } from "next/server";
import { isSupabaseReviewsEnabled } from "@/lib/auth-mode";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { submitReviewReport } from "@/lib/reviews-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PostBody = {
  reason?: string;
  details?: string;
};

const REPORT_REASONS = new Set([
  "spam",
  "offensive",
  "fake",
  "irrelevant",
  "other",
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseReviewsEnabled()) {
    return NextResponse.json({ error: "Reviews API unavailable" }, { status: 503 });
  }

  const ip = getClientIp(request);
  const limit = checkRateLimit(`review-report:ip:${ip}`, 5, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Слишком много жалоб. Повторите позже." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const { id: reviewId } = await context.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as PostBody;
  const reason = body.reason?.trim();
  if (!reason || !REPORT_REASONS.has(reason)) {
    return NextResponse.json({ error: "Укажите причину жалобы" }, { status: 400 });
  }

  const result = await submitReviewReport(supabase, {
    reviewId,
    reporterUserId: user.id,
    reason,
    details: body.details?.trim(),
  });

  if ("error" in result) {
    const status = result.error.includes("уже") ? 409 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ ok: true, reportId: result.reportId });
}
