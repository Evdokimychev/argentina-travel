import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { fetchPublicHealthSnapshot } from "@/lib/monitoring/health-public";
import { fetchProductionReadinessSnapshot } from "@/lib/ops/production-readiness-server";
import { readOpsStatusSnapshot } from "@/lib/ops/ops-status";
import { invalidateSiteFeaturesCache, invalidateSiteLegalCache } from "@/lib/site-settings-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

const ALLOWED_KEYS = ["site.legal", "site.features"] as const;

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("site_settings").select("key, value, updated_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settings: Record<string, Json> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  return NextResponse.json({
    settings,
    ops: readOpsStatusSnapshot(),
    productionReadiness: fetchProductionReadinessSnapshot(),
    publicHealth: await fetchPublicHealthSnapshot({ includeSearchIndexCount: false }),
  });
}

export async function PATCH(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as { key?: string; value?: Json };
  const key = body.key?.trim();
  if (!key || !ALLOWED_KEYS.includes(key as (typeof ALLOWED_KEYS)[number])) {
    return NextResponse.json({ error: "Недопустимый ключ настройки" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("site_settings").upsert(
    {
      key,
      value: body.value ?? {},
      updated_by: auth.actorId,
    },
    { onConflict: "key" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (key === "site.features") {
    invalidateSiteFeaturesCache();
  }
  if (key === "site.legal") {
    invalidateSiteLegalCache();
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "settings.update",
    entityType: "site_settings",
    entityId: key,
    payload: { value: body.value },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ ok: true });
}
