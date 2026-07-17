import { NextResponse } from "next/server";
import { authorizeApartmentOrganizer } from "@/lib/apartments/apartment-auth-server";
import { isUuid } from "@/lib/apartments/apartment-validation";

type Context = { params: Promise<{ id: string }> };

async function ownedApartment(id: string) {
  const auth = await authorizeApartmentOrganizer();
  if (!auth.ok) return auth;
  // Generated database types intentionally lag this new migration until the integration gate.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: owned } = await (auth.admin as any).from("apartment_listings").select("id").eq("id", id).eq("owner_user_id", auth.user.id).maybeSingle();
  return owned ? auth : { ok: false as const, response: NextResponse.json({ error: "Доступ запрещён." }, { status: 403 }) };
}

export async function GET(_request: Request, context: Context) {
  const { id } = await context.params;
  if (!isUuid(id)) return NextResponse.json({ error: "Объект не найден." }, { status: 404 });
  const auth = await ownedApartment(id);
  if (!auth.ok) return auth.response;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (auth.admin as any).from("apartment_availability_blocks").select("id,stay_range,status,note").eq("apartment_id", id).order("created_at");
  if (error) return NextResponse.json({ error: "Не удалось загрузить календарь." }, { status: 503 });
  return NextResponse.json({ blocks: data ?? [] });
}

export async function PUT(request: Request, context: Context) {
  const { id } = await context.params;
  if (!isUuid(id)) return NextResponse.json({ error: "Объект не найден." }, { status: 404 });
  const auth = await ownedApartment(id);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null) as { blocks?: unknown; expectedVersion?: unknown } | null;
  if (!Array.isArray(body?.blocks) || body!.blocks.length > 730 || !Number.isSafeInteger(body?.expectedVersion)) return NextResponse.json({ error: "Проверьте календарь и обновите объект." }, { status: 400 });
  const blocks = body!.blocks.map((raw) => {
    const row = raw && typeof raw === "object" ? raw as Record<string, unknown> : {};
    return { start_date: typeof row.startDate === "string" ? row.startDate : "", end_date: typeof row.endDate === "string" ? row.endDate : "", note: typeof row.note === "string" ? row.note.slice(0, 500) : "" };
  });
  if (blocks.some((block) => !/^\d{4}-\d{2}-\d{2}$/.test(block.start_date) || !/^\d{4}-\d{2}-\d{2}$/.test(block.end_date) || block.end_date <= block.start_date)) return NextResponse.json({ error: "Дата окончания каждого периода должна быть позже даты начала." }, { status: 400 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (auth.admin as any).rpc("apartment_replace_availability", { p_apartment_id: id, p_expected_version: body!.expectedVersion, p_actor_user_id: auth.user.id, p_blocks: blocks });
  if (error) {
    const message = String(error.message ?? "");
    if (message.includes("VERSION_CONFLICT")) return NextResponse.json({ error: "Объект уже изменён. Обновите страницу и повторите." }, { status: 409 });
    if (message.includes("FORBIDDEN")) return NextResponse.json({ error: "Этот календарь принадлежит другому организатору." }, { status: 403 });
    return NextResponse.json({ error: String(error.code) === "23P01" ? "Периоды пересекаются с подтверждённым или заблокированным проживанием." : "Не удалось сохранить календарь." }, { status: String(error.code) === "23P01" ? 409 : 400 });
  }
  return NextResponse.json({ blocks: data });
}
