import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { listManagedApartments, saveApartmentDraft } from "@/lib/apartments/apartment-repository-server";
import { isUuid, parseApartmentDraftInput } from "@/lib/apartments/apartment-validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isApartmentOwnerCandidate } from "@/lib/apartments/apartment-auth-server";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "marketplace.moderation");
  if (!auth.ok) return auth.response;
  const db = createSupabaseAdminClient();
  const { data: owners } = await db.from("profiles").select("id, first_name, last_name, email, roles").order("first_name");
  return NextResponse.json({ apartments: await listManagedApartments(), owners: (owners ?? [])
    .filter((owner) => owner.roles.some((role) => role === "organizer" || role === "admin"))
    .map((owner) => ({ id: owner.id, label: `${owner.first_name} ${owner.last_name}`.trim() || owner.email })) });
}

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "marketplace.moderation");
  if (!auth.ok) return auth.response;
  if (auth.via !== "session" || !isUuid(auth.actorId)) return NextResponse.json({ error: "Создание требует личной сессии администратора." }, { status: 403 });
  const raw = await request.json().catch(() => null) as Record<string, unknown> | null;
  const ownerUserId = raw?.ownerUserId;
  const parsed = parseApartmentDraftInput(raw);
  if (!isUuid(ownerUserId) || !parsed.ok) return NextResponse.json({ error: parsed.ok ? "Выберите владельца объекта." : parsed.error }, { status: 400 });
  if (!await isApartmentOwnerCandidate(ownerUserId)) return NextResponse.json({ error: "Владельцем может быть администратор или допущенный организатор." }, { status: 400 });
  try {
    const apartment = await saveApartmentDraft({ actorUserId: auth.actorId, ownerUserId, actorIsAdmin: true, draft: parsed.value });
    return NextResponse.json({ apartment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Не удалось сохранить объект." }, { status: 409 });
  }
}
