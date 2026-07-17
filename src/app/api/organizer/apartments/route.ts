import { NextResponse } from "next/server";
import { authorizeApartmentOrganizer } from "@/lib/apartments/apartment-auth-server";
import { listManagedApartments, saveApartmentDraft } from "@/lib/apartments/apartment-repository-server";
import { parseApartmentDraftInput } from "@/lib/apartments/apartment-validation";

export async function GET() {
  const auth = await authorizeApartmentOrganizer();
  if (!auth.ok) return auth.response;
  return NextResponse.json({ apartments: await listManagedApartments(auth.user.id) });
}

export async function POST(request: Request) {
  const auth = await authorizeApartmentOrganizer();
  if (!auth.ok) return auth.response;
  const parsed = parseApartmentDraftInput(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const apartment = await saveApartmentDraft({ actorUserId: auth.user.id, ownerUserId: auth.user.id,
      actorIsAdmin: false, draft: parsed.value });
    return NextResponse.json({ apartment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Не удалось сохранить черновик. Проверьте уникальность адреса страницы." }, { status: 409 });
  }
}
