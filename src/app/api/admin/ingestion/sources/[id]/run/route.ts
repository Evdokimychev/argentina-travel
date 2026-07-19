import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { enqueueIngestionRun, processIngestionRun } from "@/lib/ingestion/pipeline-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 300;
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdminRequest(request, "sources.run"); if (!auth.ok) return auth.response;
  try {
    const { id } = await params; const db = createSupabaseAdminClient();
    const queued = await enqueueIngestionRun(db, id, { triggerKind: "manual", actorId: auth.actorId, idempotencyKey: request.headers.get("idempotency-key") ?? undefined });
    const result = queued.existing ? queued : await processIngestionRun(db, queued.runId);
    await writeAdminAuditLog({ actorUserId: auth.actorId, action: "ingestion.run.manual", entityType: "ingestion_run", entityId: queued.runId, payload: { sourceId: id, existing: queued.existing }, ipAddress: clientIpFromRequest(request) });
    return NextResponse.json({ run: result }, { status: queued.existing ? 202 : 200 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Запуск не выполнен" }, { status: 409 }); }
}
