import { NextResponse } from "next/server";
import { authorizeApartmentOrganizer } from "@/lib/apartments/apartment-auth-server";
import { saveApartmentDraft } from "@/lib/apartments/apartment-repository-server";
import { isUuid, parseApartmentDraftInput } from "@/lib/apartments/apartment-validation";

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: Context) {
  const auth = await authorizeApartmentOrganizer();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const raw = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!isUuid(id) || !raw || !Number.isInteger(raw.expectedVersion)) return NextResponse.json({ error: "Некорректная версия объекта." }, { status: 400 });
  const parsed = parseApartmentDraftInput(raw);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const apartment = await saveApartmentDraft({ apartmentId: id, expectedVersion: Number(raw.expectedVersion),
      actorUserId: auth.user.id, ownerUserId: auth.user.id, actorIsAdmin: false, draft: parsed.value });
    return NextResponse.json({ apartment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message.includes("VERSION_CONFLICT") ? 409 : message.includes("FORBIDDEN") ? 403 : 400;
    return NextResponse.json({ error: status === 409 ? "Объект уже изменён в другой вкладке. Обновите страницу." : "Не удалось обновить черновик." }, { status });
  }
}
