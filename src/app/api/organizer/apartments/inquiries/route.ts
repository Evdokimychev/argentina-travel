import { NextResponse } from "next/server";
import { authorizeApartmentOrganizer } from "@/lib/apartments/apartment-auth-server";
import {
  isApartmentInquiryStatus,
  listApartmentInquiries,
} from "@/lib/apartments/apartment-inquiry-operations-server";

export async function GET(request: Request) {
  const auth = await authorizeApartmentOrganizer();
  if (!auth.ok) return auth.response;
  const requestedStatus = new URL(request.url).searchParams.get("status");
  if (requestedStatus && !isApartmentInquiryStatus(requestedStatus)) {
    return NextResponse.json({ error: "Неизвестный фильтр заявок." }, { status: 400 });
  }
  const status = requestedStatus && isApartmentInquiryStatus(requestedStatus)
    ? requestedStatus
    : undefined;
  try {
    return NextResponse.json(
      { inquiries: await listApartmentInquiries({ ownerUserId: auth.user.id, status }) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Не удалось загрузить заявки." }, { status: 503 });
  }
}
