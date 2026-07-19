import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { publishIngestionCandidateAsDraft } from "@/lib/ingestion/pipeline-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminCapability } from "@/types/admin";

const capabilityByAction: Record<string, AdminCapability> = { approve: "moderation.approve", reject: "moderation.reject", defer: "processing_queue.manage", reprocess: "processing_queue.manage", publish: "moderation.publish", duplicate_keep_primary: "processing_queue.manage", duplicate_keep_both: "processing_queue.manage", duplicate_as_update: "processing_queue.manage", duplicate_related: "processing_queue.manage" };
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json() as { action?: string; notes?: string; title?: string; summary?: string; content?: string; suggestedTarget?: string };
  const capability = body.action ? capabilityByAction[body.action] : undefined;
  if (!capability) return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  const auth = await authorizeAdminRequest(request, capability); if (!auth.ok) return auth.response;
  const { id } = await params; const db = createSupabaseAdminClient();
  try {
    if (body.action === "publish") {
      const document = await publishIngestionCandidateAsDraft(db, id, auth.actorId, clientIpFromRequest(request));
      await writeAdminAuditLog({ actorUserId: auth.actorId, action: "ingestion.candidate.publish_draft", entityType: "ingestion_candidate", entityId: id, payload: { cmsDocumentId: document.id }, ipAddress: clientIpFromRequest(request) });
      return NextResponse.json({ document });
    }
    if (body.action?.startsWith("duplicate_")) {
      const resolution = body.action === "duplicate_keep_primary" ? "keep_primary" : body.action === "duplicate_keep_both" ? "keep_both" : body.action === "duplicate_as_update" ? "as_update" : "related";
      const candidateStatus = resolution === "keep_primary" ? "rejected" : resolution === "as_update" ? "approved" : "awaiting_moderation";
      const resolvedBy = /^[0-9a-f-]{36}$/i.test(auth.actorId) ? auth.actorId : null;
      const { error: linkError } = await db.from("ingestion_duplicate_links").update({ resolution, resolved_by: resolvedBy, resolved_at: new Date().toISOString() }).eq("candidate_id", id);
      if (linkError) throw linkError;
      await db.from("ingestion_candidates").update({ status: candidateStatus, moderation_notes: body.notes?.slice(0, 2000), moderated_by: resolvedBy, moderated_at: new Date().toISOString() }).eq("id", id);
      await writeAdminAuditLog({ actorUserId: auth.actorId, action: `ingestion.duplicate.${resolution}`, entityType: "ingestion_candidate", entityId: id, ipAddress: clientIpFromRequest(request) });
      return NextResponse.json({ ok: true, resolution, status: candidateStatus });
    }
    const status = body.action === "approve" ? "approved" : body.action === "reject" ? "rejected" : body.action === "defer" ? "deferred" : "reprocess";
    const { data, error } = await db.from("ingestion_candidates").update({ status, moderation_notes: body.notes?.slice(0, 2000), moderated_by: /^[0-9a-f-]{36}$/i.test(auth.actorId) ? auth.actorId : null, moderated_at: new Date().toISOString(), ...(body.title ? { title: body.title.slice(0, 180) } : {}), ...(body.summary ? { summary: body.summary.slice(0, 1000) } : {}), ...(body.content ? { processed_content: body.content } : {}), ...(body.suggestedTarget ? { suggested_target: body.suggestedTarget } : {}) }).eq("id", id).select("*").single();
    if (error) throw error;
    await writeAdminAuditLog({ actorUserId: auth.actorId, action: `ingestion.candidate.${body.action}`, entityType: "ingestion_candidate", entityId: id, payload: { notes: Boolean(body.notes), edited: Boolean(body.title || body.summary || body.content) }, ipAddress: clientIpFromRequest(request) });
    return NextResponse.json({ candidate: data });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Действие не выполнено" }, { status: 409 }); }
}
