import { NextResponse } from "next/server";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { resolveTourOwnerUserId } from "@/lib/organizer-public";
import { upsertTourFromCanonical } from "@/lib/tour-content-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { userHasAccountRole } from "@/types/user";
import type { Tour } from "@/types/tour";

export async function POST(request: Request) {
  if (!isSupabaseToursEnabled()) {
    return NextResponse.json({ error: "Tours sync unavailable" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as { tour?: Tour };
    const tour = body.tour ?? null;

    if (!tour) {
      return NextResponse.json({ error: "Некорректные данные тура" }, { status: 400 });
    }

    const ownerUserId = resolveTourOwnerUserId(tour);
    if (ownerUserId !== sessionUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await upsertTourFromCanonical(supabase, tour, ownerUserId);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
