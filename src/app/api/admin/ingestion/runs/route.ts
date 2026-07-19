import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "ingestion_runs.view"); if (!auth.ok) return auth.response;
  const url = new URL(request.url); const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));
  let query = createSupabaseAdminClient().from("ingestion_source_runs").select("*, ingestion_sources(name,source_type)").order("created_at", { ascending: false }).limit(limit);
  const status = url.searchParams.get("status"); if (status) query = query.eq("status", status);
  const sourceId = url.searchParams.get("source"); if (sourceId) query = query.eq("source_id", sourceId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Не удалось загрузить запуски" }, { status: 503 });
  return NextResponse.json({ runs: data ?? [] });
}
