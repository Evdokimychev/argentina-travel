import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { API_KEY_SELECT_COLUMNS, mapApiKeyRow } from "@/lib/public-api/api-key-mapper";
import { generatePublicApiKey, parsePublicApiScopes } from "@/lib/public-api/keys";
import { attachUsageStats, fetchApiKeyUsageStats } from "@/lib/public-api/usage-log";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select(API_KEY_SELECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const keys = (data ?? []).map(mapApiKeyRow);
  const stats = await fetchApiKeyUsageStats(keys.map((key) => key.id));

  return NextResponse.json({
    keys: attachUsageStats(keys, stats),
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
    .select(API_KEY_SELECT_COLUMNS)
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
    key: {
      ...mapApiKeyRow(data),
      usage: { requestsLast7d: 0, topEndpoints: [] },
    },
    rawKey,
  });
}
