import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { enqueueIngestionRun, processIngestionRun } from "@/lib/ingestion/pipeline-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 300;
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdminRequest(request, "ingestion_runs.retry"); if (!auth.ok) return auth.response;
  const { id } = await params; const body = await request.json().catch(() => ({})) as { action?: string }; const db = createSupabaseAdminClient();
  const { data: run } = await db.from("ingestion_source_runs").select("*").eq("id", id).maybeSingle();
  if (!run) return NextResponse.json({ error: "Запуск не найден" }, { status: 404 });
  if (body.action === "cancel") {
    await db.from("ingestion_source_runs").update({ cancel_requested_at: new Date().toISOString() }).eq("id", id).in("status", ["pending", "fetching", "fetched", "normalizing", "processing"]);
    await writeAdminAuditLog({ actorUserId: auth.actorId, action: "ingestion.run.cancel", entityType: "ingestion_run", entityId: id, ipAddress: clientIpFromRequest(request) });
    return NextResponse.json({ ok: true });
  }
  if (!body.action || body.action === "retry") {
    const queued = await enqueueIngestionRun(db, run.source_id, { triggerKind: "retry", actorId: auth.actorId, retryOfRunId: id });
    const result = queued.existing ? queued : await processIngestionRun(db, queued.runId);
    await writeAdminAuditLog({ actorUserId: auth.actorId, action: "ingestion.run.retry", entityType: "ingestion_run", entityId: queued.runId, payload: { retryOf: id }, ipAddress: clientIpFromRequest(request) });
    return NextResponse.json({ run: result });
  }
  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}
