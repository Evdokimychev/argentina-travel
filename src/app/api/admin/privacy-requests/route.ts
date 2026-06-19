import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { writeAdminAuditLog, clientIpFromRequest } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database";
import type { PrivacyRequestStatus } from "@/types/privacy";

const VALID_STATUSES: PrivacyRequestStatus[] = [
  "pending",
  "approved",
  "processing",
  "completed",
  "rejected",
  "failed",
];

type AuditRow = {
  id: string;
  entity_id: string | null;
  actor_user_id: string | null;
  action: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.leads");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  let query = supabase
    .from("privacy_requests")
    .select(
      "id, user_id, request_type, status, reason, metadata, requested_at, processed_at, processed_by, notes, created_at, updated_at"
    )
    .order("requested_at", { ascending: false })
    .limit(100);

  if (status && VALID_STATUSES.includes(status as PrivacyRequestStatus)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = Array.from(new Set((data ?? []).map((row) => row.user_id)));
  const profileById = new Map<string, { email: string | null; full_name: string | null }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name")
      .in("id", userIds);

    for (const profile of profiles ?? []) {
      profileById.set(profile.id, {
        email: profile.email,
        full_name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || null,
      });
    }
  }

  const requestIds = (data ?? []).map((row) => row.id);
  const auditByRequestId = new Map<string, AuditRow[]>();
  const auditActorIds = new Set<string>();

  if (requestIds.length > 0) {
    const { data: audits } = await supabase
      .from("admin_audit_log")
      .select("id, entity_id, actor_user_id, action, payload, created_at")
      .eq("entity_type", "privacy_request")
      .in("entity_id", requestIds)
      .order("created_at", { ascending: false })
      .limit(400);

    for (const audit of (audits ?? []) as AuditRow[]) {
      if (!audit.entity_id) continue;
      const list = auditByRequestId.get(audit.entity_id) ?? [];
      list.push(audit);
      auditByRequestId.set(audit.entity_id, list);
      if (audit.actor_user_id) {
        auditActorIds.add(audit.actor_user_id);
      }
    }
  }

  if (auditActorIds.size > 0) {
    const { data: actorProfiles } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name")
      .in("id", [...auditActorIds]);

    for (const profile of actorProfiles ?? []) {
      profileById.set(profile.id, {
        email: profile.email,
        full_name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || null,
      });
    }
  }

  const items = (data ?? []).map((row) => {
    const profile = profileById.get(row.user_id);
    const auditLog = (auditByRequestId.get(row.id) ?? []).map((entry) => {
      const actorProfile = entry.actor_user_id ? profileById.get(entry.actor_user_id) : null;
      return {
        id: entry.id,
        action: entry.action,
        actorUserId: entry.actor_user_id,
        actorLabel:
          actorProfile?.full_name ??
          actorProfile?.email ??
          entry.actor_user_id ??
          "system",
        payload: entry.payload ?? {},
        createdAt: entry.created_at,
      };
    });

    return {
      ...row,
      userEmail: profile?.email ?? null,
      userFullName: profile?.full_name ?? null,
      auditLog,
    };
  });

  return NextResponse.json({ items });
}

type PatchBody = {
  id?: string;
  action?: "approve" | "reject";
  notes?: string;
};

function mergeMetadata(previous: Json, patch: Record<string, unknown>): Json {
  if (!previous || typeof previous !== "object" || Array.isArray(previous)) {
    return patch as Json;
  }
  return {
    ...previous,
    ...patch,
  } as Json;
}

export async function PATCH(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.leads");
  if (!auth.ok) return auth.response;

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  const action = body.action;
  const notes =
    typeof body.notes === "string" ? body.notes.trim().slice(0, 4000) : undefined;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("privacy_requests")
    .select("id, user_id, status, metadata")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (existing.status === "completed" || existing.status === "rejected") {
    return NextResponse.json(
      { error: "Заявка уже находится в финальном статусе" },
      { status: 409 }
    );
  }

  if (action === "approve" && (existing.status === "approved" || existing.status === "processing")) {
    return NextResponse.json(
      { error: "Заявка уже подтверждена и находится в очереди обработки" },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const nextStatus: PrivacyRequestStatus =
    action === "approve" ? "approved" : "rejected";

  const updatePayload: Database["public"]["Tables"]["privacy_requests"]["Update"] = {
    status: nextStatus,
    processed_at: action === "reject" ? now : null,
    processed_by: auth.via === "session" ? auth.actorId : null,
    metadata: mergeMetadata(existing.metadata, {
      ...(action === "approve" ? { approvedAt: now } : { rejectedAt: now }),
      ...(action === "approve"
        ? { approvedBy: auth.via === "session" ? auth.actorId : "service-role" }
        : { rejectedBy: auth.via === "session" ? auth.actorId : "service-role" }),
    }),
  };

  if (notes !== undefined) {
    updatePayload.notes = notes || null;
  }

  const { data, error } = await supabase
    .from("privacy_requests")
    .update(updatePayload)
    .eq("id", id)
    .select("id, status, processed_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (action === "approve") {
    await supabase
      .from("profiles")
      .update({
        deleted_at: now,
      })
      .eq("id", existing.user_id)
      .is("deleted_at", null);
  }

  if (auth.via === "session") {
    void writeAdminAuditLog({
      actorUserId: auth.actorId,
      action: action === "approve" ? "privacy_request.approve" : "privacy_request.reject",
      entityType: "privacy_request",
      entityId: id,
      payload: { status: nextStatus, notes: notes ?? null },
      ipAddress: clientIpFromRequest(request),
    });
  }

  return NextResponse.json({ ok: true, request: data });
}
