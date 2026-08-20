import { NextResponse } from "next/server";
import { isSupabaseToursEnabled } from "@/lib/auth-mode";
import {
  addOrganizerWaitlistComment,
  fetchOrganizerWaitlistEntry,
  updateOrganizerWaitlistStatus,
} from "@/lib/organizer-waitlist-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import type { WaitlistStatus } from "@/types/waitlist";
import { userHasAccountRole } from "@/types/user";
import { unexpectedPublicApiError } from "@/lib/public-api/safe-error";

type RouteContext = { params: Promise<{ id: string }> };

async function requireOrganizer() {
  if (!isSupabaseToursEnabled()) {
    return { ok: false as const, response: NextResponse.json({ error: "Лист ожидания недоступен" }, { status: 503 }) };
  }
  const supabase = await createSupabaseServerClient();
  const user = await loadSessionUserFromSupabase(supabase);
  if (!user || !userHasAccountRole(user, "organizer")) {
    return { ok: false as const, response: NextResponse.json({ error: "Доступ запрещён" }, { status: 403 }) };
  }
  return { ok: true as const, user, admin: createSupabaseAdminClient() };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireOrganizer();
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const entry = await fetchOrganizerWaitlistEntry(auth.admin, auth.user.id, id);
    if (!entry) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json(unexpectedPublicApiError(), { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireOrganizer();
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const body = (await request.json()) as {
      action?: "update_status" | "add_comment";
      status?: WaitlistStatus;
      text?: string;
    };
    let entry;
    if (body.action === "update_status" && body.status) {
      entry = await updateOrganizerWaitlistStatus({
        admin: auth.admin,
        organizerId: auth.user.id,
        waitlistId: id,
        status: body.status,
      });
    } else if (body.action === "add_comment") {
      const text = body.text?.trim() ?? "";
      if (!text || text.length > 2000) {
        return NextResponse.json({ error: "Заметка должна содержать от 1 до 2000 символов" }, { status: 400 });
      }
      entry = await addOrganizerWaitlistComment({
        admin: auth.admin,
        organizerId: auth.user.id,
        waitlistId: id,
        text,
        authorName: auth.user.fullName || auth.user.email,
      });
    } else {
      return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
    }
    if (!entry) return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
    return NextResponse.json({ entry });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "Недопустимый переход статуса") {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json(unexpectedPublicApiError(), { status: 500 });
  }
}
