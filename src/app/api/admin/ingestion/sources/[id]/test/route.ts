import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { getSourceAdapter } from "@/lib/ingestion/adapters";
import { getIngestionSource } from "@/lib/ingestion/repository-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdminRequest(request, "sources.view"); if (!auth.ok) return auth.response;
  const { id } = await params; const db = createSupabaseAdminClient(); const source = await getIngestionSource(db, id);
  if (!source) return NextResponse.json({ error: "Источник не найден" }, { status: 404 });
  const adapter = getSourceAdapter(source.sourceType); const health = await adapter.testConnection(source);
  await db.from("ingestion_sources").update({ last_tested_at: new Date().toISOString(), last_test_ok: health.ok, status: health.ok ? (source.enabled ? "active" : source.status) : "degraded", last_error: health.ok ? null : health.message }).eq("id", id);
  let preview: Array<{ title: string; excerpt: string; sourceUrl: string | null; publishedAt: string | null; mediaCount: number }> = [];
  if (health.ok) {
    const result = await adapter.fetch({ ...source, connectionConfig: { ...source.connectionConfig, limit: 3, importMedia: false } });
    preview = result.items.map((item) => ({ title: item.title ?? "Без заголовка", excerpt: (item.rawContent ?? "").slice(0, 300), sourceUrl: item.canonicalUrl ?? item.sourceUrl ?? null, publishedAt: item.publishedAt ?? null, mediaCount: item.media?.length ?? item.attachments?.length ?? 0 }));
  }
  return NextResponse.json({ health, preview }, { status: health.ok ? 200 : 424 });
}
