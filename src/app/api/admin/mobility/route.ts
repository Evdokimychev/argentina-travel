import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { isUuid } from "@/lib/admin/user-identity-management";
import { callMobilityRpc } from "@/lib/mobility/rpc-server";
import type { MobilityInventory } from "@/types/mobility";
import { isMobilityVertical } from "@/types/mobility";

function failureStatus(code: string): number {
  return code === "VERSION_CONFLICT" ? 409 : code === "NOT_FOUND" ? 404 : code === "FORBIDDEN" ? 403 : code === "INVALID" ? 400 : 503;
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "marketplace.moderation");
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const vertical = url.searchParams.get("vertical");
  if (vertical && !isMobilityVertical(vertical)) return NextResponse.json({ error: "Некорректный тип" }, { status: 400 });
  const result = await callMobilityRpc<MobilityInventory>("mobility_list_inventory", {
    p_actor_user_id: isUuid(auth.actorId) ? auth.actorId : null,
    p_actor_scope: "admin",
    p_vertical: vertical,
    p_market_id: url.searchParams.get("marketId"),
  });
  if (!result.ok) return NextResponse.json({ error: result.message, code: result.code }, { status: failureStatus(result.code) });
  return NextResponse.json({ inventory: result.data });
}

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "marketplace.moderation");
  if (!auth.ok) return auth.response;
  if (auth.via !== "session" || !isUuid(auth.actorId)) {
    return NextResponse.json({ error: "Решение модератора требует личную сессию" }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  const expectedVersion = Number(body.expectedVersion);
  if (body.action !== "review_document" && !Number.isSafeInteger(expectedVersion)) {
    return NextResponse.json({ error: "Некорректная версия" }, { status: 400 });
  }
  let result;
  if (body.action === "transition") {
    result = await callMobilityRpc<Record<string, unknown>>("mobility_transition_item", {
      p_actor_user_id: auth.actorId,
      p_actor_scope: "admin",
      p_entity_type: body.entityType,
      p_entity_id: body.entityId,
      p_expected_version: expectedVersion,
      p_next_status: body.nextStatus,
    });
  } else if (body.action === "verify_vehicle") {
    result = await callMobilityRpc<Record<string, unknown>>("mobility_admin_verify_vehicle", {
      p_actor_user_id: auth.actorId,
      p_vehicle_id: body.vehicleId,
      p_expected_version: expectedVersion,
      p_approved: body.approved === true,
      p_documents_valid_until: typeof body.documentsValidUntil === "string" ? body.documentsValidUntil : null,
    });
  } else if (body.action === "verify_provider_market") {
    result = await callMobilityRpc<Record<string, unknown>>("mobility_admin_verify_provider_market", {
      p_actor_user_id: auth.actorId,
      p_provider_id: body.providerId,
      p_vertical: body.vertical,
      p_market_id: body.marketId,
      p_expected_version: expectedVersion,
      p_approved: body.approved === true,
    });
  } else if (body.action === "review_document") {
    result = await callMobilityRpc<Record<string, unknown>>("mobility_admin_review_document", {
      p_actor_user_id: auth.actorId,
      p_document_id: body.documentId,
      p_approved: body.approved === true,
    });
  } else {
    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  }
  if (!result.ok) return NextResponse.json({ error: result.message, code: result.code }, { status: failureStatus(result.code) });
  return NextResponse.json({ result: result.data });
}
