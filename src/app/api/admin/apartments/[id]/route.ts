import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { saveApartmentDraft } from "@/lib/apartments/apartment-repository-server";
import { isUuid, parseApartmentDraftInput } from "@/lib/apartments/apartment-validation";
import { isApartmentOwnerCandidate } from "@/lib/apartments/apartment-auth-server";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const auth = await authorizeAdminRequest(request, "marketplace.moderation");
  if (!auth.ok) return auth.response;
  if (auth.via !== "session" || !isUuid(auth.actorId)) return NextResponse.json({ error: "Изменение требует личной сессии администратора." }, { status: 403 });
  const { id } = await context.params;
  const raw = await request.json().catch(() => null) as Record<string, unknown> | null;
  const ownerUserId = raw?.ownerUserId;
  const parsed = parseApartmentDraftInput(raw);
  if (!isUuid(id) || !isUuid(ownerUserId) || !raw || !Number.isInteger(raw.expectedVersion) || !parsed.ok) return NextResponse.json({ error: parsed.ok ? "Проверьте владельца и версию объекта." : parsed.error }, { status: 400 });
  if (!await isApartmentOwnerCandidate(ownerUserId)) return NextResponse.json({ error: "Владельцем может быть администратор или допущенный организатор." }, { status: 400 });
  try {
    const apartment = await saveApartmentDraft({ apartmentId: id, expectedVersion: Number(raw.expectedVersion), actorUserId: auth.actorId, ownerUserId, actorIsAdmin: true, draft: parsed.value });
    return NextResponse.json({ apartment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json({ error: message.includes("VERSION_CONFLICT") ? "Объект уже изменён. Обновите страницу." : "Не удалось обновить объект." }, { status: message.includes("VERSION_CONFLICT") ? 409 : 400 });
  }
}
