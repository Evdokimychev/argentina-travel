import { NextResponse } from "next/server";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { userHasAccountRole } from "@/types/user";
import { patchOrganizerGroupTripListing } from "@/lib/group-trips-server";
import type { OrganizerGroupTripPatchAction } from "@/types/group-trips";

type RouteContext = { params: Promise<{ id: string }> };

interface PatchBody {
  action?: OrganizerGroupTripPatchAction;
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSupabaseToursEnabled()) {
    return NextResponse.json({ error: "Набор группы недоступен" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);
    if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    const { id } = await context.params;
    const body = (await request.json()) as PatchBody;
    if (body.action !== "confirm" && body.action !== "cancel") {
      return NextResponse.json({ error: "Укажите action: confirm или cancel" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const result = await patchOrganizerGroupTripListing(
      admin,
      id,
      sessionUser.id,
      body.action
    );

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
    }

    return NextResponse.json({ listing: result.listing });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
