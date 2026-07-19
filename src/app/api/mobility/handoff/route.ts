import { NextResponse } from "next/server";
import { isUuid } from "@/lib/admin/user-identity-management";
import { enforceMobilityModuleAccess } from "@/lib/mobility/module-policy-server";
import { callMobilityRpc } from "@/lib/mobility/rpc-server";
import { isMobilityVertical } from "@/types/mobility";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const vertical = body?.vertical;
  if (!body || !isMobilityVertical(vertical)) return NextResponse.json({ error: "Некорректный тип" }, { status: 400 });
  const blocked = await enforceMobilityModuleAccess(vertical);
  if (blocked) return blocked;
  const operationId = typeof body.operationId === "string" ? body.operationId : crypto.randomUUID();
  if (!isUuid(String(body.providerId)) || !isUuid(operationId) || typeof body.marketId !== "string") {
    return NextResponse.json({ error: "Некорректный переход" }, { status: 400 });
  }
  const result = await callMobilityRpc<void>("mobility_record_partner_handoff", {
    p_provider_id: body.providerId,
    p_vertical: vertical,
    p_market_id: body.marketId,
    p_operation_id: operationId,
    p_placement: typeof body.placement === "string" ? body.placement : "mobility_catalog",
  });
  if (!result.ok) return NextResponse.json({ error: result.message, code: result.code }, { status: result.code === "INVALID" ? 409 : 503 });
  return NextResponse.json({ recorded: true });
}
