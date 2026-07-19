import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import {
  apartmentInquiryMutationError,
  isApartmentInquiryStatus,
  transitionApartmentInquiry,
} from "@/lib/apartments/apartment-inquiry-operations-server";
import { isUuid } from "@/lib/apartments/apartment-validation";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const auth = await authorizeAdminRequest(request, "marketplace.moderation");
  if (!auth.ok) return auth.response;
  if (auth.via !== "session" || !isUuid(auth.actorId)) {
    return NextResponse.json({ error: "Изменение требует личной сессии администратора." }, { status: 403 });
  }
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const expectedVersion = body?.expectedVersion;
  const nextStatus = body?.nextStatus;
  const note = typeof body?.note === "string" ? body.note.trim() : "";
  if (!isUuid(id) || !Number.isSafeInteger(expectedVersion) || Number(expectedVersion) < 1
    || !isApartmentInquiryStatus(nextStatus) || note.length > 1000) {
    return NextResponse.json({ error: "Проверьте действие и комментарий." }, { status: 400 });
  }
  try {
    await transitionApartmentInquiry({
      inquiryId: id,
      expectedVersion: Number(expectedVersion),
      actorUserId: auth.actorId,
      actorIsAdmin: true,
      nextStatus,
      note,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const mapped = apartmentInquiryMutationError(error);
    return NextResponse.json({ error: mapped.message }, { status: mapped.status });
  }
}
