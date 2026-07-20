import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminCapability } from "@/types/admin";
import type { CmsDocumentBody } from "@/types/cms-content";
import type { Json } from "@/types/database";

type ProposalAction = "accept" | "apply" | "reject";

const capabilityByAction: Record<ProposalAction, AdminCapability> = {
  accept: "moderation.approve",
  apply: "moderation.publish",
  reject: "moderation.reject",
};

function reviewerId(actorId: string): string | null {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(actorId)
    ? actorId
    : null;
}

function isCmsDocumentBody(value: unknown): value is CmsDocumentBody {
  return Boolean(value && typeof value === "object" && !Array.isArray(value) && "kind" in value);
}

function atomicApplyError(error: { code?: string; message?: string }) {
  const message = error.message ?? "";
  if (error.code === "40001" || message.includes("STALE") || message.includes("NOT_ACCEPTED")) {
    return { status: 409, message: "Предложение или страница уже изменены. Обновите очередь." };
  }
  if (error.code === "P0002" || message.includes("NOT_FOUND")) {
    return { status: 404, message: "Предложение или связанная страница не найдены" };
  }
  if (error.code === "42501") {
    return { status: 403, message: "Недостаточно прав для применения предложения" };
  }
  return { status: 503, message: "Не удалось применить предложение к CMS" };
}

function recordFromJson(value: Json): Record<string, Json | undefined> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, Json | undefined>
    : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const body = await request.json().catch(() => null) as { action?: ProposalAction } | null;
  const action = body?.action;
  if (!action || !Object.hasOwn(capabilityByAction, action)) {
    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  }
  const capability = capabilityByAction[action];

  const auth = await authorizeAdminRequest(request, capability);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const proposalId = decodeURIComponent(id);
  const db = createSupabaseAdminClient();
  const { data: proposal, error: proposalError } = await db
    .from("ingestion_update_proposals")
    .select("*")
    .eq("id", proposalId)
    .maybeSingle();
  if (proposalError) {
    return NextResponse.json({ error: "Не удалось загрузить предложение" }, { status: 503 });
  }
  if (!proposal) {
    return NextResponse.json({ error: "Предложение не найдено" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const reviewedBy = reviewerId(auth.actorId);
  const ipAddress = clientIpFromRequest(request);

  if (action === "accept" || action === "reject") {
    const allowedStatuses = action === "accept" ? ["pending"] : ["pending", "accepted"];
    const nextStatus = action === "accept" ? "accepted" : "rejected";
    const { data: updated, error: updateError } = await db
      .from("ingestion_update_proposals")
      .update({ status: nextStatus, reviewed_by: reviewedBy, reviewed_at: now })
      .eq("id", proposalId)
      .in("status", allowedStatuses)
      .select("*")
      .maybeSingle();
    if (updateError) {
      return NextResponse.json({ error: "Не удалось сохранить решение" }, { status: 503 });
    }
    if (!updated) {
      return NextResponse.json(
        { error: "Предложение уже обработано. Обновите очередь." },
        { status: 409 },
      );
    }
    await writeAdminAuditLog({
      actorUserId: reviewedBy,
      action: `ingestion.proposal.${action}`,
      entityType: "ingestion_update_proposal",
      entityId: proposalId,
      payload: {
        candidateId: proposal.candidate_id,
        contentDocumentId: proposal.content_document_id,
        baseVersion: proposal.base_version,
      },
      ipAddress,
    });
    return NextResponse.json({ proposal: updated });
  }

  if (proposal.status !== "accepted") {
    return NextResponse.json(
      { error: "Сначала примите предложение редакторским решением" },
      { status: 409 },
    );
  }
  if (!isCmsDocumentBody(proposal.proposed_body)) {
    return NextResponse.json({ error: "Предложение содержит некорректный формат CMS" }, { status: 422 });
  }

  const { data: result, error: applyError } = await db.rpc("apply_ingestion_update_proposal_atomic", {
    p_proposal_id: proposalId,
    p_actor_id: reviewedBy,
    p_ip_address: ipAddress,
  });
  if (applyError) {
    const failure = atomicApplyError(applyError);
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }
  const payload = recordFromJson(result);
  if (!payload?.proposal || !payload.document) {
    return NextResponse.json({ error: "CMS вернула неполный результат применения" }, { status: 503 });
  }
  return NextResponse.json({ proposal: payload.proposal, document: payload.document });
}
