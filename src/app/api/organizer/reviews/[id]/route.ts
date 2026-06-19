import { NextResponse } from "next/server";
import { isSupabaseReviewsEnabled } from "@/lib/auth-mode";
import { getOrganizerCatalogSlugs } from "@/lib/organizer-bookings";
import { updateOrganizerReviewReply } from "@/lib/reviews-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { userHasAccountRole } from "@/types/user";

type PatchBody = {
  replyText?: string;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseReviewsEnabled()) {
    return NextResponse.json({ error: "Reviews API unavailable" }, { status: 503 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Не передан идентификатор отзыва" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const sessionUser = await loadSessionUserFromSupabase(supabase);
  if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as PatchBody;
  if (typeof body.replyText !== "string") {
    return NextResponse.json({ error: "Поле replyText обязательно" }, { status: 400 });
  }

  const slugs = getOrganizerCatalogSlugs(sessionUser.id);
  const result = await updateOrganizerReviewReply(supabase, {
    reviewId: id,
    organizerUserId: sessionUser.id,
    organizerTourSlugs: slugs,
    replyText: body.replyText,
  });

  if ("error" in result) {
    const status =
      result.error === "Отзыв не найден" ? 404 : result.error === "Нет доступа" ? 403 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ review: result.review });
}
