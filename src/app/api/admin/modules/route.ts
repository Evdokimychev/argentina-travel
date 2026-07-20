import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import {
  DEFAULT_SITE_MODULES,
  DEFAULT_SITE_NAVIGATION,
  normalizeSiteModules,
  normalizeSiteNavigation,
} from "@/lib/cms/site-globals/normalize";
import { resolveProductModuleSnapshots } from "@/lib/modules/registry";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value, updated_at, row_version")
    .in("key", ["site.navigation", "site.modules"]);

  if (error) {
    return NextResponse.json(
      { error: "Не удалось загрузить состояния модулей" },
      { status: 500 },
    );
  }

  const rows = new Map((data ?? []).map((row) => [row.key, row]));
  const navigationRow = rows.get("site.navigation");
  const modulesRow = rows.get("site.modules");
  const navigation = normalizeSiteNavigation(navigationRow?.value ?? DEFAULT_SITE_NAVIGATION);
  const modules = normalizeSiteModules(modulesRow?.value ?? DEFAULT_SITE_MODULES);

  return NextResponse.json({
    modules: resolveProductModuleSnapshots(navigation, modules),
    settings: {
      navigation,
      modules,
    },
    rowVersions: {
      "site.navigation": navigationRow?.row_version ?? 0,
      "site.modules": modulesRow?.row_version ?? 0,
    },
    updatedAt: {
      "site.navigation": navigationRow?.updated_at ?? null,
      "site.modules": modulesRow?.updated_at ?? null,
    },
    checkedAt: new Date().toISOString(),
  });
}
