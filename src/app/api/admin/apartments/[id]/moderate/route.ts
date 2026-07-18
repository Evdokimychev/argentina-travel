import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { isUuid } from "@/lib/apartments/apartment-validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type Context = { params: Promise<{ id: string }> };
const ACTIONS = new Set(["publish", "return_to_draft", "archive"]);

export async function POST(request: Request, context: Context) {
  const auth = await authorizeAdminRequest(request, "marketplace.moderation");
  if (!auth.ok) return auth.response;
  if (auth.via !== "session" || !isUuid(auth.actorId)) return NextResponse.json({ error: "Модерация требует личной сессии администратора." }, { status: 403 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const action = typeof body?.action === "string" ? body.action : "";
  if (!isUuid(id) || !ACTIONS.has(action) || !Number.isInteger(body?.expectedVersion)) return NextResponse.json({ error: "Проверьте действие и версию объекта." }, { status: 400 });
  const db = createSupabaseAdminClient();
  // Generated database types intentionally lag this new migration until the integration gate.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db as any).rpc("apartment_moderate", {
    p_apartment_id: id, p_expected_version: body!.expectedVersion, p_actor_user_id: auth.actorId,
    p_action: action, p_note: typeof body!.note === "string" ? body!.note.slice(0, 1000) : null,
  });
  if (error) {
    const message = String(error.message ?? "");
    return NextResponse.json({ error: message.includes("VERSION_CONFLICT") ? "Объект уже изменён. Обновите страницу." : message.includes("INCOMPLETE") ? "До публикации нужны точный адрес и фотографии с правами." : "Переход статуса недоступен." }, { status: message.includes("VERSION_CONFLICT") ? 409 : 400 });
  }
  return NextResponse.json({ apartment: data });
}
