import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { invalidateFeatureFlagsCache } from "@/lib/feature-flags/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

type FeatureFlagRow = {
  key: string;
  enabled: boolean;
  rollout_percent: number;
  metadata: Json;
};

const SELECT_COLUMNS = "key, enabled, rollout_percent, metadata";
const FLAG_KEY_REGEX = /^[a-z0-9_]{2,80}$/;

function normalizeRolloutPercent(input: unknown): number {
  const parsed = Number(input);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.trunc(parsed)));
}

function normalizeMetadata(input: unknown): Json {
  if (input === null || input === undefined) return {};
  if (typeof input === "string") {
    try {
      return JSON.parse(input) as Json;
    } catch {
      return {};
    }
  }
  if (typeof input === "object" || typeof input === "number" || typeof input === "boolean") {
    return input as Json;
  }
  return {};
}

function mapFlagRow(row: FeatureFlagRow) {
  return {
    key: row.key,
    enabled: row.enabled === true,
    rolloutPercent: normalizeRolloutPercent(row.rollout_percent),
    metadata: row.metadata ?? {},
  };
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("feature_flags")
    .select(SELECT_COLUMNS)
    .order("key", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    items: (data ?? []).map((row) => mapFlagRow(row as FeatureFlagRow)),
  });
}

type PostBody = {
  key?: string;
  enabled?: boolean;
  rolloutPercent?: number;
  metadata?: unknown;
};

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as PostBody;
  const key = body.key?.trim().toLowerCase();
  if (!key || !FLAG_KEY_REGEX.test(key)) {
    return NextResponse.json(
      { error: "Ключ должен быть в формате snake_case (2-80 символов)." },
      { status: 400 }
    );
  }

  const payload = {
    key,
    enabled: body.enabled === true,
    rollout_percent: normalizeRolloutPercent(body.rolloutPercent),
    metadata: normalizeMetadata(body.metadata),
  };

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("feature_flags")
    .insert(payload)
    .select(SELECT_COLUMNS)
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return NextResponse.json({ error: "Флаг с таким ключом уже существует" }, { status: 409 });
    }
    return NextResponse.json({ error: error?.message ?? "Не удалось создать флаг" }, { status: 500 });
  }

  invalidateFeatureFlagsCache(key);

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "feature_flag.create",
    entityType: "feature_flags",
    entityId: key,
    payload: {
      enabled: payload.enabled,
      rolloutPercent: payload.rollout_percent,
    },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ item: mapFlagRow(data as FeatureFlagRow) });
}

type PatchBody = {
  key?: string;
  enabled?: boolean;
  rolloutPercent?: number;
  metadata?: unknown;
};

export async function PATCH(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as PatchBody;
  const key = body.key?.trim().toLowerCase();
  if (!key || !FLAG_KEY_REGEX.test(key)) {
    return NextResponse.json({ error: "Некорректный ключ флага" }, { status: 400 });
  }

  const updatePayload: Partial<FeatureFlagRow> = {};
  if (typeof body.enabled === "boolean") {
    updatePayload.enabled = body.enabled;
  }
  if (body.rolloutPercent !== undefined) {
    updatePayload.rollout_percent = normalizeRolloutPercent(body.rolloutPercent);
  }
  if (body.metadata !== undefined) {
    updatePayload.metadata = normalizeMetadata(body.metadata);
  }
  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "Нет изменений для сохранения" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("feature_flags")
    .update(updatePayload)
    .eq("key", key)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Флаг не найден" }, { status: 404 });
  }

  invalidateFeatureFlagsCache(key);

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "feature_flag.update",
    entityType: "feature_flags",
    entityId: key,
    payload: {
      enabled: data.enabled,
      rolloutPercent: data.rollout_percent,
    },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ item: mapFlagRow(data as FeatureFlagRow) });
}

type DeleteBody = {
  key?: string;
};

export async function DELETE(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as DeleteBody;
  const key = body.key?.trim().toLowerCase();
  if (!key || !FLAG_KEY_REGEX.test(key)) {
    return NextResponse.json({ error: "Некорректный ключ флага" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("feature_flags")
    .delete()
    .eq("key", key)
    .select("key")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Флаг не найден" }, { status: 404 });
  }

  invalidateFeatureFlagsCache(key);

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "feature_flag.delete",
    entityType: "feature_flags",
    entityId: key,
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ ok: true });
}
