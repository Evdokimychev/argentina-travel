import { NextResponse } from "next/server";
import { isUuid } from "@/lib/admin/user-identity-management";
import { authorizeOrganizerMobility } from "@/lib/mobility/organizer-auth-server";
import { callMobilityRpc } from "@/lib/mobility/rpc-server";
import type { MobilityOperationsRequest } from "@/types/mobility";
import { isMobilityVertical } from "@/types/mobility";

function failureStatus(code: string): number {
  return code === "VERSION_CONFLICT" ? 409 : code === "NOT_FOUND" ? 404 : code === "FORBIDDEN" ? 403 : code === "INVALID" ? 400 : 503;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const vertical = url.searchParams.get("vertical");
  if (!isMobilityVertical(vertical)) return NextResponse.json({ error: "Выберите авто или трансфер." }, { status: 400 });
  const auth = await authorizeOrganizerMobility(vertical);
  if (!auth.ok) return auth.response;
  const result = await callMobilityRpc<MobilityOperationsRequest[]>("mobility_list_requests", {
    p_actor_user_id: auth.user.id,
    p_actor_scope: "organizer",
    p_vertical: vertical,
    p_status: url.searchParams.get("status"),
  });
  if (!result.ok) return NextResponse.json({ error: result.message, code: result.code }, { status: failureStatus(result.code) });
  return NextResponse.json({ requests: result.data }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const vertical = body?.vertical;
  if (!body || !isMobilityVertical(vertical)) return NextResponse.json({ error: "Выберите авто или трансфер." }, { status: 400 });
  const auth = await authorizeOrganizerMobility(vertical);
  if (!auth.ok) return auth.response;
  const expectedVersion = Number(body.expectedVersion);
  const operationId = typeof body.operationId === "string" ? body.operationId : "";
  if (!isUuid(String(body.requestId)) || !Number.isSafeInteger(expectedVersion) || typeof body.nextStatus !== "string" || !isUuid(operationId)) {
    return NextResponse.json({ error: "Обновите список заявок и повторите действие." }, { status: 400 });
  }
  const result = await callMobilityRpc<Record<string, unknown>>("mobility_transition_request", {
    p_actor_user_id: auth.user.id,
    p_actor_scope: "organizer",
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
