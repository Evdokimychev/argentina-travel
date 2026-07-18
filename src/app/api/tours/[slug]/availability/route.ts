import { NextResponse } from "next/server";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchTourAvailabilityBySlug } from "@/lib/tour-availability-server";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  if (!isSupabaseToursEnabled()) {
    return NextResponse.json({ error: "Доступность туров недоступна" }, { status: 503 });
  }

  try {
    const { slug } = await context.params;
    const supabase = createSupabaseAdminClient();
    const availability = await fetchTourAvailabilityBySlug(supabase, slug);

    if (!availability) {
      return NextResponse.json({ error: "Тур не найден" }, { status: 404 });
    }

    return NextResponse.json({
      slots: availability.slots,
      fallbackFromSeed: availability.slots.some((slot) => slot.source === "seed"),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
