import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { isUuid } from "@/lib/admin/user-identity-management";
import { callMobilityRpc } from "@/lib/mobility/rpc-server";
import type { MobilityOperationsRequest } from "@/types/mobility";
import { isMobilityVertical } from "@/types/mobility";

function failureStatus(code: string): number {
  return code === "VERSION_CONFLICT" ? 409 : code === "NOT_FOUND" ? 404 : code === "FORBIDDEN" ? 403 : code === "INVALID" ? 400 : 503;
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.bookings");
  if (!auth.ok) return auth.response;
  const url = new URL(request.url);
  const vertical = url.searchParams.get("vertical");
  if (vertical && !isMobilityVertical(vertical)) return NextResponse.json({ error: "Некорректный тип заявки." }, { status: 400 });
  const result = await callMobilityRpc<MobilityOperationsRequest[]>("mobility_list_requests", {
    p_actor_user_id: isUuid(auth.actorId) ? auth.actorId : null,
    p_actor_scope: "admin",
    p_vertical: vertical,
    p_status: url.searchParams.get("status"),
  });
  if (!result.ok) return NextResponse.json({ error: result.message, code: result.code }, { status: failureStatus(result.code) });
  return NextResponse.json({ requests: result.data }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.bookings");
  if (!auth.ok) return auth.response;
  if (auth.via !== "session" || !isUuid(auth.actorId)) {
    return NextResponse.json({ error: "Изменение заявки требует личную сессию." }, { status: 403 });
  }
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const expectedVersion = Number(body?.expectedVersion);
  const operationId = typeof body?.operationId === "string" ? body.operationId : "";
  if (!body || !isUuid(String(body.requestId)) || !Number.isSafeInteger(expectedVersion) || !isUuid(operationId)) {
    return NextResponse.json({ error: "Обновите список заявок и повторите действие." }, { status: 400 });
  }
  const result = await callMobilityRpc<Record<string, unknown>>("mobility_transition_request", {
    p_actor_user_id: auth.actorId,
    p_actor_scope: "admin",
    p_request_id: body.requestId,
    p_expected_version: expectedVersion,
    p_next_status: body.nextStatus,
    p_vehicle_id: isUuid(String(body.vehicleId)) ? body.vehicleId : null,
    p_starts_at: typeof body.startsAt === "string" ? body.startsAt : null,
    p_ends_at: typeof body.endsAt === "string" ? body.endsAt : null,
    p_operation_id: operationId,
  });
  if (!result.ok) return NextResponse.json({ error: result.message, code: result.code }, { status: failureStatus(result.code) });
  return NextResponse.json({ request: result.data });
}
