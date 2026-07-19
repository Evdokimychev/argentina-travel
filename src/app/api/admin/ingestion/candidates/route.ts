import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "moderation.view"); if (!auth.ok) return auth.response;
  const url = new URL(request.url); const status = url.searchParams.get("status") ?? "awaiting_moderation"; const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));
  let query = createSupabaseAdminClient().from("ingestion_candidates").select("*, ingestion_sources(name,source_type)").order("quality_score", { ascending: false }).order("created_at", { ascending: true }).limit(limit);
  if (status !== "all") query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Не удалось загрузить очередь" }, { status: 503 });
  const candidates = data ?? [];
  if (!candidates.length) return NextResponse.json({ candidates });
  const db = createSupabaseAdminClient(); const ids = candidates.map((candidate) => candidate.id);
  const { data: links } = await db.from("ingestion_duplicate_links").select("*").in("candidate_id", ids);
  const relatedIds = [...new Set((links ?? []).map((link) => link.related_candidate_id))];
  const { data: related } = relatedIds.length ? await db.from("ingestion_candidates").select("id,title,summary,processed_content,quality_score,source_id").in("id", relatedIds) : { data: [] };
  const relatedById = new Map((related ?? []).map((candidate) => [candidate.id, candidate]));
  return NextResponse.json({ candidates: candidates.map((candidate) => ({ ...candidate, duplicates: (links ?? []).filter((link) => link.candidate_id === candidate.id).map((link) => ({ ...link, related: relatedById.get(link.related_candidate_id) ?? null })) })) });
}
