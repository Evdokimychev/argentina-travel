import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { generatePublicApiKey, parsePublicApiScopes } from "@/lib/public-api/keys";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function mapApiKeyRow(row: {
  id: string;
  key_prefix: string;
  label: string;
  partner_name: string | null;
  organizer_id: string | null;
  scopes: string[] | null;
  rate_limit_per_minute: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
}) {
  return {
    id: row.id,
    keyPrefix: row.key_prefix,
    label: row.label,
    partnerName: row.partner_name,
    organizerId: row.organizer_id,
    scopes: row.scopes ?? [],
    rateLimitPerMinute: row.rate_limit_per_minute,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    revokedAt: row.revoked_at,
    lastUsedAt: row.last_used_at,
  };
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select(
      "id, key_prefix, label, partner_name, organizer_id, scopes, rate_limit_per_minute, is_active, created_at, updated_at, revoked_at, last_used_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    keys: (data ?? []).map(mapApiKeyRow),
  });
}

type PostBody = {
  label?: string;
  partnerName?: string;
  organizerId?: string | null;
  scopes?: string[];
  rateLimitPerMinute?: number;
};

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as PostBody;
  const label = body.label?.trim();
  if (!label) {
    return NextResponse.json({ error: "Укажите название ключа" }, { status: 400 });
  }

  const { rawKey, keyHash, keyPrefix } = generatePublicApiKey();
  const scopes = parsePublicApiScopes(body.scopes);
  const rateLimitPerMinute = Math.min(
    600,
    Math.max(1, body.rateLimitPerMinute ?? 60)
  );

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      key_hash: keyHash,
      key_prefix: keyPrefix,
      label,
      partner_name: body.partnerName?.trim() || null,
      organizer_id: body.organizerId?.trim() || null,
      scopes,
      rate_limit_per_minute: rateLimitPerMinute,
      created_by: auth.actorId === "service-role" ? null : auth.actorId,
    })
    .select(
      "id, key_prefix, label, partner_name, organizer_id, scopes, rate_limit_per_minute, is_active, created_at, updated_at, revoked_at, last_used_at"
    )
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Не удалось создать ключ" }, { status: 500 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "api_key.create",
    entityType: "api_keys",
    entityId: data.id,
    payload: { label, partnerName: body.partnerName ?? null },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({
    key: mapApiKeyRow(data),
    rawKey,
  });
}
