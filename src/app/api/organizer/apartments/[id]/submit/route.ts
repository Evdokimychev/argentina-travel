import { NextResponse } from "next/server";
import { authorizeApartmentOrganizer } from "@/lib/apartments/apartment-auth-server";
import { isUuid } from "@/lib/apartments/apartment-validation";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const auth = await authorizeApartmentOrganizer();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { expectedVersion?: unknown } | null;
  if (!isUuid(id) || !Number.isInteger(body?.expectedVersion)) return NextResponse.json({ error: "Некорректная версия объекта." }, { status: 400 });
  // Generated database types intentionally lag this new migration until the integration gate.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (auth.admin as any).rpc("apartment_submit_for_review", {
    p_apartment_id: id, p_expected_version: body!.expectedVersion, p_actor_user_id: auth.user.id,
  });
  if (error) {
    const message = String(error.message ?? "");
    if (message.includes("VERSION_CONFLICT")) return NextResponse.json({ error: "Объект уже изменён. Обновите страницу." }, { status: 409 });
    if (message.includes("INCOMPLETE")) return NextResponse.json({ error: "До проверки заполните описание, правила, точный адрес и хотя бы одну фотографию с правами." }, { status: 400 });
    return NextResponse.json({ error: "Не удалось отправить объект на проверку." }, { status: message.includes("FORBIDDEN") ? 403 : 400 });
  }
  return NextResponse.json({ apartment: data, message: "Объект отправлен администратору. Самостоятельная публикация недоступна." });
}
