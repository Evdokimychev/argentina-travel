import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { writeAdminAuditLog, clientIpFromRequest } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import type { PrivacyRequestStatus } from "@/types/privacy";

const VALID_STATUSES: PrivacyRequestStatus[] = [
  "pending",
  "in_review",
  "completed",
  "rejected",
];

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

  const items = (data ?? []).map((row) => {
    const profile = profileById.get(row.user_id);
    return {
      ...row,
      userEmail: profile?.email ?? null,
      userFullName: profile?.full_name ?? null,
    };
  });

  return NextResponse.json({ items });
}

type PatchBody = {
  id?: string;
  status?: PrivacyRequestStatus;
  notes?: string;
};

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
  const status = body.status;
  const notes =
    typeof body.notes === "string" ? body.notes.trim().slice(0, 4000) : undefined;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const processedAt = status === "completed" || status === "rejected" ? new Date().toISOString() : null;

  const updatePayload: Database["public"]["Tables"]["privacy_requests"]["Update"] = {
    status,
    processed_at: processedAt,
    processed_by: auth.via === "session" ? auth.actorId : null,
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

  if (auth.via === "session") {
    void writeAdminAuditLog({
      actorUserId: auth.actorId,
      action: "privacy_request.update_status",
      entityType: "privacy_request",
      entityId: id,
      payload: { status, notes: notes ?? null },
      ipAddress: clientIpFromRequest(request),
    });
  }

  return NextResponse.json({ ok: true, request: data });
}
