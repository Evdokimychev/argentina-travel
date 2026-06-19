import { NextResponse } from "next/server";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import { createMinimalTourFromDraft, organizerDraftToTour } from "@/lib/tour-mapper";
import { upsertTourFromCanonical } from "@/lib/tour-content-server";
import { rowToTour } from "@/lib/tour-content-mapper";
import { getCatalogSlug } from "@/lib/tour-slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import type { OrganizerTourDraft } from "@/types/organizer-tour";
import type { Tour } from "@/types/tour";
import { userHasAccountRole } from "@/types/user";

type RouteContext = { params: Promise<{ id: string }> };

interface PatchBody {
  draft?: OrganizerTourDraft;
  expectedUpdatedAt?: string | null;
  force?: boolean;
}

function toTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function isServerNewer(serverUpdatedAt: string, expectedUpdatedAt: string | null): boolean {
  const serverTs = toTimestamp(serverUpdatedAt);
  const expectedTs = toTimestamp(expectedUpdatedAt);
  if (serverTs == null || expectedTs == null) return false;
  return serverTs > expectedTs;
}

async function requireOrganizer() {
  if (!isSupabaseToursEnabled()) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Синхронизация туров недоступна" }, { status: 503 }),
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

  return { ok: true as const, supabase, sessionUser };
}

function resolveBaseTour(draft: OrganizerTourDraft, existingTour: Tour | null): Tour {
  const catalogSlug = getCatalogSlug(draft);
  const base = existingTour ?? createMinimalTourFromDraft(draft, catalogSlug);

  return {
    ...base,
    id: base.id.startsWith("org-") ? draft.id : base.id,
    slug: catalogSlug,
    organizerTourId: draft.id,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireOrganizer();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const { data, error } = await auth.supabase
    .from("tours")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ updatedAt: null, tour: null });
  }

  if (data.owner_user_id !== auth.sessionUser.id) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  return NextResponse.json({
    updatedAt: data.updated_at,
    tour: rowToTour(data),
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireOrganizer();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = (await request.json()) as PatchBody;
  const draft = body.draft ?? null;
  const expectedUpdatedAt =
    typeof body.expectedUpdatedAt === "string" ? body.expectedUpdatedAt : null;
  const force = Boolean(body.force);

  if (!draft || draft.id !== id) {
    return NextResponse.json({ error: "Некорректный идентификатор тура" }, { status: 400 });
  }

  if (!draft.title.trim()) {
    return NextResponse.json({ error: "Укажите название тура" }, { status: 400 });
  }

  const { data: existingRow, error: existingError } = await auth.supabase
    .from("tours")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (existingRow && existingRow.owner_user_id !== auth.sessionUser.id) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  if (!existingRow && draft.ownerUserId && draft.ownerUserId !== auth.sessionUser.id) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  if (
    existingRow &&
    !force &&
    expectedUpdatedAt &&
    isServerNewer(existingRow.updated_at, expectedUpdatedAt)
  ) {
    return NextResponse.json(
      {
        error: "Черновик уже обновлён в другом сеансе",
        serverUpdatedAt: existingRow.updated_at,
      },
      { status: 409 }
    );
  }

  const existingTour = existingRow ? rowToTour(existingRow) : null;
  const base = resolveBaseTour(draft, existingTour);
  const canonical = organizerDraftToTour(draft, base);

  const syncResult = await upsertTourFromCanonical(
    auth.supabase,
    canonical,
    auth.sessionUser.id
  );
  if ("error" in syncResult) {
    return NextResponse.json({ error: syncResult.error }, { status: 500 });
  }

  const { data: persistedRow } = await auth.supabase
    .from("tours")
    .select("updated_at")
    .eq("slug", canonical.slug)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    updatedAt: persistedRow?.updated_at ?? canonical.updatedAt ?? null,
  });
}
