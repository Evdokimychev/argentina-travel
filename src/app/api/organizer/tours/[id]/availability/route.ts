import { NextResponse } from "next/server";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { userHasAccountRole } from "@/types/user";
import {
  fetchTourAvailabilityByTourId,
  upsertTourAvailabilitySlots,
  type SlotUpsertInput,
} from "@/lib/tour-availability-server";

type RouteContext = { params: Promise<{ id: string }> };

interface UpsertBody {
  slots?: SlotUpsertInput[];
}

async function requireOrganizer() {
  if (!isSupabaseToursEnabled()) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Инвентарь недоступен" }, { status: 503 }),
    };
  }

  const supabase = await createSupabaseServerClient();
  const sessionUser = await loadSessionUserFromSupabase(supabase);
  if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Доступ запрещён" }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    sessionUser,
    admin: createSupabaseAdminClient(),
  };
}

async function assertTourOwnership(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  tourId: string,
  organizerId: string
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const { data: row, error } = await admin
    .from("tours")
    .select("id, owner_user_id")
    .eq("id", tourId)
    .maybeSingle();

  if (error) {
    return { ok: false, response: NextResponse.json({ error: error.message }, { status: 500 }) };
  }
  if (!row) {
    return { ok: false, response: NextResponse.json({ error: "Тур не найден" }, { status: 404 }) };
  }
  if (row.owner_user_id !== organizerId) {
    return { ok: false, response: NextResponse.json({ error: "Доступ запрещён" }, { status: 403 }) };
  }

  return { ok: true };
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireOrganizer();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const ownership = await assertTourOwnership(auth.admin, id, auth.sessionUser.id);
  if (!ownership.ok) return ownership.response;

  const slots = await fetchTourAvailabilityByTourId(auth.admin, id);
  return NextResponse.json({ slots });
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireOrganizer();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const ownership = await assertTourOwnership(auth.admin, id, auth.sessionUser.id);
  if (!ownership.ok) return ownership.response;

  const body = (await request.json()) as UpsertBody;
  const slots = Array.isArray(body.slots) ? body.slots : [];
  if (slots.length > 500) {
    return NextResponse.json({ error: "Слишком много слотов за один запрос" }, { status: 400 });
  }

  const saved = await upsertTourAvailabilitySlots(auth.admin, id, slots);
  if ("error" in saved) {
    return NextResponse.json({ error: saved.error }, { status: 500 });
  }

  const nextSlots = await fetchTourAvailabilityByTourId(auth.admin, id);
  return NextResponse.json({ ok: true, slots: nextSlots });
}
