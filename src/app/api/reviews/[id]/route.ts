import { NextResponse } from "next/server";
import { isSupabaseReviewsEnabled } from "@/lib/auth-mode";
import { updateReviewRecord } from "@/lib/reviews-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TouristReviewStatus } from "@/types/tourist";

type PatchBody = {
  action?: "submit" | "save_draft";
  rating?: number;
  text?: string;
  tripDate?: string;
  status?: TouristReviewStatus;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseReviewsEnabled()) {
    return NextResponse.json({ error: "Reviews API unavailable" }, { status: 503 });
  }

  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as PatchBody;
  const nextStatus: TouristReviewStatus =
    body.action === "submit" ? "pending" : body.status === "draft" ? "draft" : "draft";

  const result = await updateReviewRecord(
    supabase,
    id,
    {
      rating: body.rating,
      text: body.text,
      tripDate: body.tripDate,
      status: body.action === "submit" ? "pending" : nextStatus,
    },
    user.id
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ review: result.review });
}
