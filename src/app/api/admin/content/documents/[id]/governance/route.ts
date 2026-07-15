import { NextResponse } from "next/server";

import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { checkCmsPublicationGate } from "@/lib/cms/publication-gate";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type SourceInput = {
  action: "add_source";
  title?: string;
  authority?: string;
  url?: string;
  sourceType?: string;
  trustLevel?: Database["public"]["Tables"]["content_sources"]["Insert"]["trust_level"];
  purpose?: Database["public"]["Tables"]["content_source_links"]["Insert"]["purpose"];
  sectionId?: string;
  isPrimary?: boolean;
};

type ClaimInput = {
  action: "add_claim";
  statement?: string;
  topic?: string;
  sourceId?: string;
  riskLevel?: Database["public"]["Tables"]["knowledge_claims"]["Insert"]["risk_level"];
  lastVerifiedAt?: string;
  nextReviewAt?: string;
  sectionId?: string;
};

type VerifyClaimInput = {
  action: "verify_claim";
  claimId?: string;
  nextReviewAt?: string;
};

type GovernanceInput = SourceInput | ClaimInput | VerifyClaimInput;

function parseIsoDate(value: string | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

async function loadGovernance(documentId: string) {
  const supabase = createSupabaseAdminClient();
  const [linksResult, claimsResult, mediaResult, widgetsResult, staffResult, gate] =
    await Promise.all([
      supabase
        .from("content_source_links")
        .select("source_id, section_id, purpose, is_primary, created_at")
        .eq("content_document_id", documentId),
      supabase
        .from("knowledge_claims")
        .select("*")
        .eq("content_document_id", documentId)
        .order("next_review_at", { ascending: true }),
      supabase
        .from("content_media_usages")
        .select("media_asset_id, role, section_id")
        .eq("content_document_id", documentId),
      supabase
        .from("content_widget_usages")
        .select("widget_id, section_id, status, config")
        .eq("content_document_id", documentId),
      supabase.from("admin_staff").select("user_id").eq("is_active", true),
      checkCmsPublicationGate(supabase, documentId),
    ]);

  const firstError =
    linksResult.error ?? claimsResult.error ?? mediaResult.error ?? widgetsResult.error;
  if (firstError) return { error: firstError.message } as const;

  const sourceIds = (linksResult.data ?? []).map((link) => link.source_id);
  const mediaIds = (mediaResult.data ?? []).map((usage) => usage.media_asset_id);
  const reviewerIds = (staffResult.data ?? []).map((staff) => staff.user_id);

  const [sourcesResult, assetsResult, profilesResult] = await Promise.all([
    sourceIds.length
      ? supabase.from("content_sources").select("*").in("id", sourceIds)
      : Promise.resolve({ data: [], error: null }),
    mediaIds.length
      ? supabase.from("cms_media_assets").select("*").in("id", mediaIds)
      : Promise.resolve({ data: [], error: null }),
    reviewerIds.length
      ? supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .in("id", reviewerIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const secondaryError = sourcesResult.error ?? assetsResult.error ?? profilesResult.error;
  if (secondaryError) return { error: secondaryError.message } as const;

  const sourceById = new Map((sourcesResult.data ?? []).map((source) => [source.id, source]));
  const assetById = new Map((assetsResult.data ?? []).map((asset) => [asset.id, asset]));

  return {
    data: {
      gate,
      sources: (linksResult.data ?? []).map((link) => ({
        ...link,
        source: sourceById.get(link.source_id) ?? null,
      })),
      claims: claimsResult.data ?? [],
      media: (mediaResult.data ?? []).map((usage) => ({
        ...usage,
        asset: assetById.get(usage.media_asset_id) ?? null,
      })),
      widgets: widgetsResult.data ?? [],
      reviewers: (profilesResult.data ?? []).map((profile) => ({
        id: profile.id,
        label:
          [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
          profile.email ||
          profile.id,
      })),
    },
  } as const;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const result = await loadGovernance(decodeURIComponent(id));
  if ("error" in result) {
    return NextResponse.json(
      { error: `Редакционная модель недоступна: ${result.error}` },
      { status: 503 }
    );
  }
  return NextResponse.json(result.data);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const documentId = decodeURIComponent(id);
  const input = (await request.json()) as GovernanceInput;
  const supabase = createSupabaseAdminClient();

  if (input.action === "add_source") {
    const title = input.title?.trim();
    const authority = input.authority?.trim();
    const url = input.url?.trim();
    if (!title || !authority || !url?.startsWith("https://")) {
      return NextResponse.json(
        { error: "Укажите название, организацию и HTTPS-ссылку на источник" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const { data: source, error: sourceError } = await supabase
      .from("content_sources")
      .upsert(
        {
          title,
          authority,
          url,
          source_type: input.sourceType?.trim() || "official_page",
          checked_at: now,
          accessed_at: now,
          trust_level: input.trustLevel ?? "primary",
          status: "active",
        },
        { onConflict: "url" }
      )
      .select("id")
      .single();
    if (sourceError || !source) {
      return NextResponse.json({ error: sourceError?.message ?? "Источник не создан" }, { status: 400 });
    }

    const { error: linkError } = await supabase.from("content_source_links").upsert(
      {
        content_document_id: documentId,
        source_id: source.id,
        section_id: input.sectionId?.trim() || "",
        purpose: input.purpose ?? "reference",
        is_primary: input.isPrimary ?? true,
      },
      { onConflict: "content_document_id,source_id,section_id" }
    );
    if (linkError) return NextResponse.json({ error: linkError.message }, { status: 400 });
  } else if (input.action === "add_claim") {
    const statement = input.statement?.trim();
    const topic = input.topic?.trim();
    const lastVerifiedAt = parseIsoDate(input.lastVerifiedAt);
    const nextReviewAt = parseIsoDate(input.nextReviewAt);
    if (!statement || !topic || !input.sourceId || !lastVerifiedAt || !nextReviewAt) {
      return NextResponse.json(
        { error: "Заполните утверждение, тему, источник и обе даты проверки" },
        { status: 400 }
      );
    }
    if (new Date(nextReviewAt) <= new Date(lastVerifiedAt)) {
      return NextResponse.json({ error: "Следующая проверка должна быть позже текущей" }, { status: 400 });
    }

    const { error } = await supabase.from("knowledge_claims").insert({
      content_document_id: documentId,
      section_id: input.sectionId?.trim() || "",
      statement,
      topic,
      source_id: input.sourceId,
      risk_level: input.riskLevel ?? "medium",
      last_verified_at: lastVerifiedAt,
      next_review_at: nextReviewAt,
      verified_by: auth.actorId,
      status: "verified",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else if (input.action === "verify_claim") {
    const nextReviewAt = parseIsoDate(input.nextReviewAt);
    if (!input.claimId || !nextReviewAt || new Date(nextReviewAt) <= new Date()) {
      return NextResponse.json({ error: "Укажите будущую дату следующей проверки" }, { status: 400 });
    }
    const { error } = await supabase
      .from("knowledge_claims")
      .update({
        status: "verified",
        verified_by: auth.actorId,
        last_verified_at: new Date().toISOString(),
        next_review_at: nextReviewAt,
      })
      .eq("id", input.claimId)
      .eq("content_document_id", documentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else {
    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: `cms.governance.${input.action}`,
    entityType: "content_document",
    entityId: documentId,
    ipAddress: clientIpFromRequest(request),
  });

  const result = await loadGovernance(documentId);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json(result.data);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await authorizeAdminRequest(request, "content.edit");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const documentId = decodeURIComponent(id);
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const itemId = url.searchParams.get("itemId");
  if (!itemId || (kind !== "source" && kind !== "claim")) {
    return NextResponse.json({ error: "Не указан объект" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const result =
    kind === "claim"
      ? await supabase
          .from("knowledge_claims")
          .delete()
          .eq("id", itemId)
          .eq("content_document_id", documentId)
      : await supabase
          .from("content_source_links")
          .delete()
          .eq("source_id", itemId)
          .eq("content_document_id", documentId);

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: `cms.governance.remove_${kind}`,
    entityType: "content_document",
    entityId: documentId,
    payload: { itemId },
    ipAddress: clientIpFromRequest(request),
  });
  return NextResponse.json({ ok: true });
}
