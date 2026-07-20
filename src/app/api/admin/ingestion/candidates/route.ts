import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

type CandidateRecord = Record<string, unknown> & {
  id: string;
  normalized_document_id: string;
};

type RawRecord = {
  id: string;
  source_url: string | null;
  canonical_url: string | null;
  author: string | null;
  source_published_at: string | null;
  media: Json;
};

function recordFromJson(value: Json): Record<string, Json | undefined> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, Json | undefined>
    : null;
}

function mediaStoragePaths(rows: RawRecord[]): string[] {
  const paths = rows.flatMap((row) => Array.isArray(row.media)
    ? row.media.flatMap((item) => {
        const media = recordFromJson(item);
        return typeof media?.storagePath === "string" ? [media.storagePath] : [];
      })
    : []);
  return [...new Set(paths)];
}

function provenanceFor(
  candidate: CandidateRecord,
  rawByNormalizedId: Map<string, RawRecord>,
  signedUrlByPath: Map<string, string>,
) {
  const raw = rawByNormalizedId.get(candidate.normalized_document_id);
  if (!raw) return null;
  const media = Array.isArray(raw.media)
    ? raw.media.map((item) => {
        if (typeof item === "string") return { url: item };
        const value = recordFromJson(item);
        const storagePath = typeof value?.storagePath === "string" ? value.storagePath : null;
        return {
          filename: typeof value?.filename === "string" ? value.filename : null,
          mimeType: typeof value?.mimeType === "string" ? value.mimeType : null,
          storagePath,
          url: typeof value?.url === "string" ? value.url : null,
          signedUrl: storagePath ? signedUrlByPath.get(storagePath) ?? null : null,
        };
      })
    : [];
  return {
    url: raw.canonical_url ?? raw.source_url,
    sourceUrl: raw.source_url,
    author: raw.author,
    publishedAt: raw.source_published_at,
    media,
  };
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "moderation.view");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "awaiting_moderation";
  const requestedLimit = Number(url.searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(100, Math.max(1, Math.floor(requestedLimit)))
    : 50;
  const db = createSupabaseAdminClient();

  let candidateQuery = db
    .from("ingestion_candidates")
    .select("*, ingestion_sources(name,source_type)")
    .order("quality_score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(limit);
  if (status !== "all") candidateQuery = candidateQuery.eq("status", status);

  const [{ data: candidateData, error: candidateError }, { data: proposalData, error: proposalError }] = await Promise.all([
    candidateQuery,
    db.from("ingestion_update_proposals").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  if (candidateError || proposalError) {
    return NextResponse.json({ error: "Не удалось загрузить очередь" }, { status: 503 });
  }

  const candidates = (candidateData ?? []) as unknown as CandidateRecord[];
  const proposals = proposalData ?? [];
  const loadedCandidateIds = new Set(candidates.map((candidate) => candidate.id));
  const missingCandidateIds = [...new Set(proposals
    .map((proposal) => proposal.candidate_id)
    .filter((id) => !loadedCandidateIds.has(id)))];
  const { data: proposalCandidates, error: proposalCandidatesError } = missingCandidateIds.length
    ? await db
        .from("ingestion_candidates")
        .select("*, ingestion_sources(name,source_type)")
        .in("id", missingCandidateIds)
    : { data: [], error: null };
  if (proposalCandidatesError) {
    return NextResponse.json({ error: "Не удалось загрузить материалы предложений" }, { status: 503 });
  }

  const allCandidates = [
    ...candidates,
    ...((proposalCandidates ?? []) as unknown as CandidateRecord[]),
  ];
  const candidateById = new Map(allCandidates.map((candidate) => [candidate.id, candidate]));
  const normalizedIds = [...new Set(allCandidates.map((candidate) => candidate.normalized_document_id))];
  const { data: normalized, error: normalizedError } = normalizedIds.length
    ? await db.from("ingestion_normalized_documents").select("id,raw_document_id").in("id", normalizedIds)
    : { data: [], error: null };
  if (normalizedError) {
    return NextResponse.json({ error: "Не удалось загрузить происхождение материалов" }, { status: 503 });
  }

  const rawIds = [...new Set((normalized ?? []).map((document) => document.raw_document_id))];
  const { data: rawData, error: rawError } = rawIds.length
    ? await db
        .from("ingestion_raw_documents")
        .select("id,source_url,canonical_url,author,source_published_at,media")
        .in("id", rawIds)
    : { data: [], error: null };
  if (rawError) {
    return NextResponse.json({ error: "Не удалось загрузить первоисточники" }, { status: 503 });
  }

  const rawRows = (rawData ?? []) as RawRecord[];
  const storagePaths = mediaStoragePaths(rawRows);
  const signedUrlByPath = new Map<string, string>();
  if (storagePaths.length) {
    const { data: signedMedia } = await db.storage.from("ingestion-raw").createSignedUrls(storagePaths, 15 * 60);
    for (const item of signedMedia ?? []) {
      if (item.path && item.signedUrl) signedUrlByPath.set(item.path, item.signedUrl);
    }
  }

  const rawById = new Map(rawRows.map((raw) => [raw.id, raw]));
  const rawByNormalizedId = new Map(
    (normalized ?? []).flatMap((document) => {
      const raw = rawById.get(document.raw_document_id);
      return raw ? [[document.id, raw] as const] : [];
    }),
  );

  const candidateIds = candidates.map((candidate) => candidate.id);
  const { data: links, error: linksError } = candidateIds.length
    ? await db.from("ingestion_duplicate_links").select("*").in("candidate_id", candidateIds)
    : { data: [], error: null };
  if (linksError) {
    return NextResponse.json({ error: "Не удалось загрузить связи материалов" }, { status: 503 });
  }
  const relatedIds = [...new Set((links ?? []).map((link) => link.related_candidate_id))];
  const { data: related, error: relatedError } = relatedIds.length
    ? await db
        .from("ingestion_candidates")
        .select("id,title,summary,processed_content,quality_score,source_id")
        .in("id", relatedIds)
    : { data: [], error: null };
  if (relatedError) {
    return NextResponse.json({ error: "Не удалось загрузить похожие материалы" }, { status: 503 });
  }
  const relatedById = new Map((related ?? []).map((candidate) => [candidate.id, candidate]));

  const documentIds = [...new Set(proposals.map((proposal) => proposal.content_document_id))];
  const { data: documents, error: documentsError } = documentIds.length
    ? await db
        .from("content_documents")
        .select("id,title,status,row_version,updated_at")
        .in("id", documentIds)
    : { data: [], error: null };
  if (documentsError) {
    return NextResponse.json({ error: "Не удалось загрузить связанные страницы" }, { status: 503 });
  }
  const documentById = new Map((documents ?? []).map((document) => [document.id, document]));

  return NextResponse.json({
    candidates: candidates.map((candidate) => ({
      ...candidate,
      provenance: provenanceFor(candidate, rawByNormalizedId, signedUrlByPath),
      duplicates: (links ?? [])
        .filter((link) => link.candidate_id === candidate.id)
        .map((link) => ({
          ...link,
          related: relatedById.get(link.related_candidate_id) ?? null,
        })),
    })),
    proposals: proposals.map((proposal) => {
      const candidate = candidateById.get(proposal.candidate_id) ?? null;
      return {
        ...proposal,
        candidate: candidate
          ? { ...candidate, provenance: provenanceFor(candidate, rawByNormalizedId, signedUrlByPath) }
          : null,
        document: documentById.get(proposal.content_document_id) ?? null,
      };
    }),
  });
}
