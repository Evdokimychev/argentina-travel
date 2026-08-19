import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import {
  PARTNER_FIELD_OWNERSHIP,
  PARTNER_OFFER_STATE_LABELS,
} from "@/lib/admin/partner-operations";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "dashboard.view");
  if (!auth.ok) return auth.response;

  return NextResponse.json({
    fieldOwnership: PARTNER_FIELD_OWNERSHIP,
    states: PARTNER_OFFER_STATE_LABELS,
    qualityGate: "src/lib/partner-tours/offer-quality.ts",
    healthHref: "/api/health/partners",
    note:
      "Публичный каталог не показывает quarantined/rejected. Ручные overlay-поля не должны затираться provider sync, если override задан.",
  });
}
