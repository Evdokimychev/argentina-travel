import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import {
  isApartmentInquiryStatus,
  listApartmentInquiries,
} from "@/lib/apartments/apartment-inquiry-operations-server";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "marketplace.moderation");
  if (!auth.ok) return auth.response;
  if (auth.via !== "session") {
    return NextResponse.json({ error: "Просмотр контактов требует личной сессии администратора." }, { status: 403 });
  }
  const requestedStatus = new URL(request.url).searchParams.get("status");
  if (requestedStatus && !isApartmentInquiryStatus(requestedStatus)) {
    return NextResponse.json({ error: "Неизвестный фильтр заявок." }, { status: 400 });
  }
  const status = requestedStatus && isApartmentInquiryStatus(requestedStatus)
    ? requestedStatus
    : undefined;
  try {
    return NextResponse.json(
      { inquiries: await listApartmentInquiries({ status }) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Не удалось загрузить заявки." }, { status: 503 });
  }
}
