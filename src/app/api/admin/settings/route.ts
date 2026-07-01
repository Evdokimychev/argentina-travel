import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { sanitizeGlobalForSave } from "@/lib/cms/site-globals/normalize";
import { SITE_GLOBAL_BY_KEY } from "@/lib/cms/site-globals/registry";
import { fetchPublicHealthSnapshot } from "@/lib/monitoring/health-public";
import { fetchAnalyticsReadinessSnapshot } from "@/lib/ops/analytics-readiness-server";
import { fetchProductionReadinessSnapshot } from "@/lib/ops/production-readiness-server";
import { readOpsStatusSnapshot } from "@/lib/ops/ops-status";
import {
  fetchAllSiteGlobalsForAdmin,
  invalidateSiteGlobal,
} from "@/lib/site-settings-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  fetchCmsCutoverReadiness,
} from "@/lib/cms/cms-cutover";
import { fetchCmsOpsSummary } from "@/lib/cms/cms-ops";
import { normalizeSiteFeatures } from "@/lib/cms/site-globals/normalize";
import { readCronHealthReport } from "@/lib/ops/ops-status";
import type { Json } from "@/types/database";
import type { SiteGlobalKey } from "@/types/site-globals";
import { SITE_GLOBAL_KEYS } from "@/types/site-globals";

const ALLOWED_KEYS = new Set<string>(SITE_GLOBAL_KEYS);

function isAllowedKey(key: string): key is SiteGlobalKey {
  return ALLOWED_KEYS.has(key);
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("site_settings").select("key, value, updated_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settings: Record<string, Json> = {};
  const updatedAt: Record<string, string> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
    updatedAt[row.key] = row.updated_at;
  }

  const normalized = await fetchAllSiteGlobalsForAdmin();
  const cmsOps = await fetchCmsOpsSummary(supabase);

  return NextResponse.json({
    settings: {
      "site.legal": normalized["site.legal"],
      "site.features": normalized["site.features"],
      "site.branding": normalized["site.branding"],
      "site.seo": normalized["site.seo"],
      "site.contact": normalized["site.contact"],
      "site.maintenance": normalized["site.maintenance"],
    },
    updatedAt,
    globalsMeta: Object.values(SITE_GLOBAL_BY_KEY).map((g) => ({
      key: g.key,
      label: g.label,
      description: g.description,
    })),
    ops: readOpsStatusSnapshot(),
    cmsOps,
    cronHealth: readCronHealthReport(12),
    productionReadiness: fetchProductionReadinessSnapshot(),
    analyticsReadiness: fetchAnalyticsReadinessSnapshot(),
    publicHealth: await fetchPublicHealthSnapshot({ includeSearchIndexCount: false }),
  });
}

export async function PATCH(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as {
    key?: string;
    value?: Json;
    batch?: Array<{ key: string; value: Json }>;
  };

  const updates: Array<{ key: SiteGlobalKey; value: Json }> = [];

  if (body.batch?.length) {
    for (const item of body.batch) {
      if (!isAllowedKey(item.key)) {
        return NextResponse.json({ error: `Недопустимый ключ: ${item.key}` }, { status: 400 });
      }
      updates.push({
        key: item.key,
        value: sanitizeGlobalForSave((item.value ?? {}) as Record<string, unknown>) as Json,
      });
    }
  } else if (body.key && isAllowedKey(body.key)) {
    updates.push({
      key: body.key,
      value: sanitizeGlobalForSave((body.value ?? {}) as Record<string, unknown>) as Json,
    });
  } else {
    return NextResponse.json({ error: "Недопустимый ключ настройки" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  for (const update of updates) {
    if (update.key === "site.features") {
      const features = normalizeSiteFeatures(update.value);
      const readiness = await fetchCmsCutoverReadiness();

      if (features.cmsBlogCutover && !readiness.blog.canEnable) {
        return NextResponse.json(
          {
            error: "Нельзя включить CMS-only для блога: не все TS-slug опубликованы в CMS",
            lane: "blog",
            missingSlugs: readiness.blog.missingSlugs,
          },
          { status: 400 }
        );
      }
      if (features.cmsGuideCutover && !readiness.guide.canEnable) {
        return NextResponse.json(
          {
            error: "Нельзя включить CMS-only для путеводителя: не все TS-slug опубликованы в CMS",
            lane: "guide",
            missingSlugs: readiness.guide.missingSlugs,
          },
          { status: 400 }
        );
      }
      if (features.cmsDestinationCutover && !readiness.destination.canEnable) {
        return NextResponse.json(
          {
            error: "Нельзя включить CMS-only для направлений: не все TS-slug опубликованы в CMS",
            lane: "destination",
            missingSlugs: readiness.destination.missingSlugs,
          },
          { status: 400 }
        );
      }
      if (features.cmsPlaceCutover && !readiness.place.canEnable) {
        return NextResponse.json(
          {
            error: "Нельзя включить CMS-only для мест: не все TS-slug опубликованы в CMS",
            lane: "place",
            missingSlugs: readiness.place.missingSlugs,
          },
          { status: 400 }
        );
      }
    }

    const { error } = await supabase.from("site_settings").upsert(
      {
        key: update.key,
        value: update.value,
        updated_by: auth.actorId,
      },
      { onConflict: "key" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    invalidateSiteGlobal(update.key);

    await writeAdminAuditLog({
      actorUserId: auth.actorId,
      action: "settings.update",
      entityType: "site_settings",
      entityId: update.key,
      payload: { value: update.value },
      ipAddress: clientIpFromRequest(request),
    });
  }

  return NextResponse.json({ ok: true, saved: updates.map((u) => u.key) });
}
