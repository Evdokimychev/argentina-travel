import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { enqueueIngestionRun, processIngestionRun } from "@/lib/ingestion/pipeline-server";
import { getIngestionSource } from "@/lib/ingestion/repository-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const maxDuration = 120;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdminRequest(request, "sources.run"); if (!auth.ok) return auth.response;
  const { id } = await params; const body = await request.json() as { title?: string; content?: string; sourceUrl?: string; publishedAt?: string };
  if (!body.content?.trim() || body.content.trim().length < 20) return NextResponse.json({ error: "Добавьте текст материала" }, { status: 400 });
  const db = createSupabaseAdminClient(); const source = await getIngestionSource(db, id);
  if (!source || source.sourceType !== "manual") return NextResponse.json({ error: "Ручной источник не найден" }, { status: 404 });
  if (!source.enabled) return NextResponse.json({ error: "Сначала проверьте и включите источник" }, { status: 409 });
  const manualItem = { id: `manual-${Date.now()}`, title: body.title?.trim() || "Материал редакции", body: body.content.trim(), url: body.sourceUrl?.trim() || undefined, publishedAt: body.publishedAt || undefined };
  const queued = await enqueueIngestionRun(db, id, { triggerKind: "manual", actorId: auth.actorId, manualItems: [manualItem] });
  if (queued.existing) return NextResponse.json({ error: "Предыдущая ручная загрузка ещё обрабатывается", runId: queued.runId }, { status: 409 });
  const result = await processIngestionRun(db, queued.runId);
  await writeAdminAuditLog({ actorUserId: auth.actorId, action: "ingestion.manual.upload", entityType: "ingestion_source", entityId: id, payload: { runId: queued.runId, hasSourceUrl: Boolean(manualItem.url) }, ipAddress: clientIpFromRequest(request) });
  return NextResponse.json({ run: result });
}
