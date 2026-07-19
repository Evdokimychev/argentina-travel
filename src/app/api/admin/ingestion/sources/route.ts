import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createIngestionSource, listIngestionSources } from "@/lib/ingestion/repository-server";
import { sourcePatchFromBody } from "@/lib/ingestion/api-validation";
import { getSourceAdapter } from "@/lib/ingestion/adapters";
import type { IngestionSourceRecord } from "@/types/ingestion";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "sources.view"); if (!auth.ok) return auth.response;
  try { return NextResponse.json({ sources: await listIngestionSources(createSupabaseAdminClient()) }); }
  catch { return NextResponse.json({ error: "Не удалось загрузить источники" }, { status: 503 }); }
}

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "sources.create"); if (!auth.ok) return auth.response;
  try {
    const patch = sourcePatchFromBody(await request.json() as Record<string, unknown>);
    if (!patch.name || !patch.sourceType) return NextResponse.json({ error: "Укажите название и тип источника" }, { status: 400 });
    const draft = { ...patch, id: "draft", status: patch.status ?? "draft", language: patch.language ?? "ru", categories: patch.categories ?? [], connectionConfig: patch.connectionConfig ?? {}, credentialRef: patch.credentialRef ?? null } as IngestionSourceRecord;
    const validation = getSourceAdapter(patch.sourceType).validateConfig(draft);
    if (!validation.ok) return NextResponse.json({ error: validation.errors.join("; ") }, { status: 400 });
    const source = await createIngestionSource(createSupabaseAdminClient(), { ...patch, name: patch.name, sourceType: patch.sourceType });
    await writeAdminAuditLog({ actorUserId: auth.actorId, action: "ingestion.source.create", entityType: "ingestion_source", entityId: source.id, payload: { sourceType: source.sourceType, enabled: source.enabled, credentialRef: source.credentialRef }, ipAddress: clientIpFromRequest(request) });
    return NextResponse.json({ source }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Не удалось создать источник" }, { status: 400 }); }
}
