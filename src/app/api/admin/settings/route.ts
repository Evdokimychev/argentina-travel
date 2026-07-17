import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest } from "@/lib/admin/audit";
import {
  createSettingsConfirmationToken,
  detectDangerousSettingsChanges,
  settingsConfirmationMatches,
  type SiteSettingsCasUpdate,
} from "@/lib/admin/settings-control";
import {
  normalizeSiteGlobalByKey,
  normalizeSiteFeatures,
  normalizeSiteForms,
  sanitizeGlobalForSave,
} from "@/lib/cms/site-globals/normalize";
import { SITE_GLOBAL_BY_KEY } from "@/lib/cms/site-globals/registry";
import { fetchPublicHealthSnapshot } from "@/lib/monitoring/health-public";
import { fetchAnalyticsReadinessSnapshot } from "@/lib/ops/analytics-readiness-server";
import { fetchProductionReadinessSnapshot } from "@/lib/ops/production-readiness-server";
import { fetchCronHealthReport, readOpsStatusSnapshot } from "@/lib/ops/ops-status";
import {
  fetchAllSiteGlobalsForAdmin,
  invalidateSiteGlobal,
} from "@/lib/site-settings-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchCmsCutoverReadiness } from "@/lib/cms/cms-cutover";
import { fetchCmsOpsSummary } from "@/lib/cms/cms-ops";
import { fetchSearchOpsSnapshot } from "@/lib/search/search-ops-server";
import { getIntegrationReadiness } from "@/lib/integrations/admin-readiness";
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
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value, updated_at, row_version");

  if (error) {
    return NextResponse.json(
      { error: "Не удалось загрузить настройки. Обновите страницу через минуту." },
      { status: 503 },
    );
  }

  const settings: Record<string, Json> = {};
  const updatedAt: Record<string, string> = {};
  const rowVersions: Record<string, number> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
    updatedAt[row.key] = row.updated_at;
    rowVersions[row.key] = row.row_version;
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
      "site.navigation": normalized["site.navigation"],
      "site.design": normalized["site.design"],
      "site.blog": normalized["site.blog"],
      "site.commerce": normalized["site.commerce"],
      "site.modules": normalized["site.modules"],
      "site.forms": normalized["site.forms"],
      "site.email": normalized["site.email"],
      "site.marketing": normalized["site.marketing"],
      "site.maintenance": normalized["site.maintenance"],
    },
    updatedAt,
    rowVersions,
    globalsMeta: Object.values(SITE_GLOBAL_BY_KEY).map((g) => ({
      key: g.key,
      label: g.label,
      description: g.description,
    })),
    ops: readOpsStatusSnapshot(),
    cmsOps,
    cronHealth: await fetchCronHealthReport(12),
    searchOps: fetchSearchOpsSnapshot(),
    integrations: getIntegrationReadiness(),
    productionReadiness: fetchProductionReadinessSnapshot(),
    analyticsReadiness: fetchAnalyticsReadinessSnapshot(),
    publicHealth: await fetchPublicHealthSnapshot({ includeSearchIndexCount: false }),
  });
}

export async function PATCH(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  let body: {
    key?: string;
    value?: Json;
    expectedVersion?: number;
    batch?: Array<{ key: string; value: Json; expectedVersion?: number }>;
    confirmationToken?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Некорректный формат настроек" }, { status: 400 });
  }

  const updates: SiteSettingsCasUpdate[] = [];

  if (body.batch?.length) {
    for (const item of body.batch) {
      if (!isAllowedKey(item.key)) {
        return NextResponse.json({ error: `Недопустимый ключ: ${item.key}` }, { status: 400 });
      }
      updates.push({
        key: item.key,
        expectedVersion: item.expectedVersion ?? -1,
        value: sanitizeGlobalForSave(
          normalizeSiteGlobalByKey(item.key, item.value ?? {}) as Record<string, unknown>,
        ) as Json,
      });
    }
  } else if (body.key && isAllowedKey(body.key)) {
    updates.push({
      key: body.key,
      expectedVersion: body.expectedVersion ?? -1,
      value: sanitizeGlobalForSave(
        normalizeSiteGlobalByKey(body.key, body.value ?? {}) as Record<string, unknown>,
      ) as Json,
    });
  } else {
    return NextResponse.json({ error: "Недопустимый ключ настройки" }, { status: 400 });
  }

  if (new Set(updates.map((update) => update.key)).size !== updates.length) {
    return NextResponse.json({ error: "Одна настройка указана в пакете несколько раз" }, { status: 400 });
  }
  if (
    updates.some(
      (update) => !Number.isSafeInteger(update.expectedVersion) || update.expectedVersion < 0,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Настройки на странице устарели. Обновите страницу и повторите изменение.",
        code: "SETTINGS_VERSION_REQUIRED",
      },
      { status: 428 },
    );
  }

  const supabase = createSupabaseAdminClient();

  // Validate the complete batch before the first database write so an invalid
  // later entry cannot leave a partially published settings snapshot.
  for (const update of updates) {
    if (update.key === "site.forms") {
      const forms = normalizeSiteForms(update.value);
      if (
        forms.captchaMode !== "off" &&
        (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ||
          !process.env.TURNSTILE_SECRET_KEY?.trim())
      ) {
        return NextResponse.json(
          {
            error:
              "Нельзя включить CAPTCHA: публичный и секретный ключи Turnstile ещё не настроены в защищённом окружении",
          },
          { status: 400 },
        );
      }
    }

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
  }

  const { data: currentRows, error: currentError } = await supabase
    .from("site_settings")
    .select("key, value, row_version")
    .in("key", updates.map((update) => update.key));
  if (currentError) {
    return NextResponse.json(
      { error: "Не удалось проверить актуальность настроек. Повторите через минуту." },
      { status: 503 },
    );
  }

  const currentValues: Partial<Record<SiteGlobalKey, Json>> = {};
  const currentVersions: Partial<Record<SiteGlobalKey, number>> = {};
  for (const row of currentRows ?? []) {
    if (isAllowedKey(row.key)) {
      currentValues[row.key] = normalizeSiteGlobalByKey(row.key, row.value) as unknown as Json;
      currentVersions[row.key] = row.row_version;
    }
  }
  for (const update of updates) {
    if (!(update.key in currentValues)) {
      currentValues[update.key] = normalizeSiteGlobalByKey(
        update.key,
        undefined,
      ) as unknown as Json;
    }
  }
  if (
    updates.some(
      (update) => (currentVersions[update.key] ?? 0) !== update.expectedVersion,
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Эти настройки уже изменил другой администратор. Проверьте свежую версию и сохраните снова.",
        code: "SETTINGS_CONFLICT",
        currentVersions,
      },
      { status: 409 },
    );
  }
  const risks = detectDangerousSettingsChanges(currentValues, updates);
  if (risks.length > 0) {
    const expectedToken = createSettingsConfirmationToken(updates, risks);
    if (!settingsConfirmationMatches(body.confirmationToken, expectedToken)) {
      return NextResponse.json(
        {
          error: "Подтвердите изменения, которые могут скрыть разделы или остановить обращения.",
          code: "SETTINGS_CONFIRMATION_REQUIRED",
          requiresConfirmation: true,
          confirmationToken: expectedToken,
          risks: risks.map(({ id, label }) => ({ id, label })),
        },
        { status: 428 },
      );
    }
  }

  const { data: savedResult, error } = await supabase.rpc(
    "admin_update_site_settings_atomic",
    {
      p_updates: updates as unknown as Json,
      p_actor_user_id: auth.via === "session" ? auth.actorId : null,
      p_actor_kind: auth.via,
      p_ip_address: clientIpFromRequest(request),
      p_confirmed_risks: risks.map((risk) => risk.id),
    },
  );

  if (error) {
    if (error.code === "40001" || error.message.includes("SETTINGS_CONFLICT")) {
      const { data: latestRows } = await supabase
        .from("site_settings")
        .select("key, row_version")
        .in("key", updates.map((update) => update.key));
      const latestVersions: Partial<Record<SiteGlobalKey, number>> = {};
      for (const row of latestRows ?? []) {
        if (isAllowedKey(row.key)) latestVersions[row.key] = row.row_version;
      }
      return NextResponse.json(
        {
          error:
            "Эти настройки уже изменил другой администратор. Страница обновлена — проверьте изменения и сохраните снова.",
          code: "SETTINGS_CONFLICT",
          currentVersions: latestVersions,
        },
        { status: 409 },
      );
    }
    if (error.code === "22023") {
      return NextResponse.json({ error: "Пакет настроек не прошёл проверку" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Не удалось сохранить настройки. Изменения не применены." },
      { status: 503 },
    );
  }

  for (const update of updates) {
    invalidateSiteGlobal(update.key);
  }

  const savedPayload =
    savedResult && typeof savedResult === "object" && !Array.isArray(savedResult)
      ? (savedResult as { saved?: unknown }).saved
      : undefined;
  return NextResponse.json({
    ok: true,
    saved: Array.isArray(savedPayload) ? savedPayload : updates.map(({ key }) => ({ key })),
  });
}
