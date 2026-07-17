import { NextResponse } from "next/server";
import { createExpertInquiry } from "@/lib/expert-inquiries-server";
import { fetchExpertBySlug } from "@/lib/local-experts-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { isSupabaseAuthEnabled } from "@/lib/auth-mode";
import { publicApiError } from "@/lib/public-api/safe-error";

const SAFE_INQUIRY_VALIDATION_ERRORS = new Set([
  "Введите сообщение",
  "Сообщение слишком длинное",
  "Эксперт недоступен для обращений",
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  if (!isSupabaseAuthEnabled()) {
    return NextResponse.json(
      publicApiError("SERVICE_UNAVAILABLE"),
      { status: 503 }
    );
  }

  try {
    const { slug } = await context.params;
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (!sessionUser) {
      return NextResponse.json(publicApiError("AUTH_REQUIRED"), { status: 401 });
    }

    const expert = await fetchExpertBySlug(supabase, slug);
    if (!expert || expert.status !== "published") {
      return NextResponse.json(publicApiError("RESOURCE_NOT_FOUND"), { status: 404 });
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
      if (SAFE_INQUIRY_VALIDATION_ERRORS.has(result.error)) {
        return NextResponse.json({ code: "INVALID_REQUEST", error: result.error }, { status: 400 });
      }
      return NextResponse.json(publicApiError("SERVICE_UNAVAILABLE"), { status: 503 });
    }

    return NextResponse.json({
      inquiry: result.inquiry,
      threadId: result.threadId,
      messageHref: result.threadId
        ? `/profile/messages?thread=${encodeURIComponent(result.threadId)}`
        : null,
    });
  } catch {
    return NextResponse.json(publicApiError("SERVICE_UNAVAILABLE"), { status: 500 });
  }
}
