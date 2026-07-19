import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await authorizeAdminRequest(request, "marketplace.moderation");
  if (!auth.ok) return auth.response;
  if (auth.via !== "session") {
    return NextResponse.json({ error: "Для действия нужен личный вход администратора" }, { status: 403 });
  }

  let body: { action?: unknown; expectedVersion?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  const action = body.action === "unpublish" || body.action === "archive" ? body.action : null;
  const expectedVersion = Number(body.expectedVersion);
  if (!action || !Number.isInteger(expectedVersion) || expectedVersion < 1) {
    return NextResponse.json({ error: "Проверьте действие и версию предложения" }, { status: 400 });
  }

  const { id } = await context.params;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("admin_unpublish_tour_atomic", {
    p_tour_id: id,
    p_expected_version: expectedVersion,
    p_actor_user_id: auth.actorId,
    p_action: action,
    p_ip_address: clientIpFromRequest(request),
  });
  if (error) {
    if (error.message.includes("TOUR_VERSION_CONFLICT")) {
      return NextResponse.json(
        { error: "Предложение уже изменилось. Обновите список и повторите действие." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Не удалось изменить публикацию. Повторите попытку позже." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, result: data });
}
