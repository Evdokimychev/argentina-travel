import { NextResponse } from "next/server";
import { hasAdminCapability } from "@/lib/admin/capabilities";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { sourcePatchFromBody } from "@/lib/ingestion/api-validation";
import { getIngestionSource, updateIngestionSource } from "@/lib/ingestion/repository-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdminRequest(request, "sources.view"); if (!auth.ok) return auth.response;
  const { id } = await params; const source = await getIngestionSource(createSupabaseAdminClient(), id);
  return source ? NextResponse.json({ source }) : NextResponse.json({ error: "Источник не найден" }, { status: 404 });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdminRequest(request, "sources.edit"); if (!auth.ok) return auth.response;
  try {
    const db = createSupabaseAdminClient(); const { id } = await params; const current = await getIngestionSource(db, id);
    if (!current) return NextResponse.json({ error: "Источник не найден" }, { status: 404 });
    const patch = sourcePatchFromBody(await request.json() as Record<string, unknown>);
    if (patch.credentialRef !== undefined && !hasAdminCapability(auth.capabilities, "source_credentials.manage")) return NextResponse.json({ error: "Нет права изменять ссылку на секреты" }, { status: 403 });
    if (patch.enabled !== undefined) {
      const permission = patch.enabled ? "sources.enable" : "sources.disable";
      if (!hasAdminCapability(auth.capabilities, permission)) return NextResponse.json({ error: "Нет права менять состояние источника" }, { status: 403 });
      if (patch.enabled && (!current.lastTestOk || !current.lastTestedAt || Date.now() - new Date(current.lastTestedAt).getTime() > 7 * 86_400_000)) return NextResponse.json({ error: "Перед включением проверьте соединение с источником" }, { status: 409 });
      patch.status = patch.enabled ? "active" : "disabled";
    }
    const source = await updateIngestionSource(db, current, patch);
    await writeAdminAuditLog({ actorUserId: auth.actorId, action: "ingestion.source.update", entityType: "ingestion_source", entityId: id, payload: { fields: Object.keys(patch), enabled: source.enabled, credentialRef: source.credentialRef }, ipAddress: clientIpFromRequest(request) });
    return NextResponse.json({ source });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Не удалось изменить источник" }, { status: 400 }); }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdminRequest(request, "sources.delete"); if (!auth.ok) return auth.response;
  const { id } = await params; const db = createSupabaseAdminClient();
  const { error } = await db.from("ingestion_sources").update({ status: "archived", enabled: false, next_run_at: null }).eq("id", id);
  if (error) return NextResponse.json({ error: "Не удалось архивировать источник" }, { status: 409 });
  await writeAdminAuditLog({ actorUserId: auth.actorId, action: "ingestion.source.archive", entityType: "ingestion_source", entityId: id, ipAddress: clientIpFromRequest(request) });
  return NextResponse.json({ ok: true });
}
