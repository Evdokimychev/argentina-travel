import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { parseAnalyticsPeriod } from "@/lib/admin/analytics-period";
import { fetchAdminDashboardWidgets } from "@/lib/admin/dashboard-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveProductModuleSnapshots } from "@/lib/modules/registry";
import { fetchSiteModules, fetchSiteNavigation } from "@/lib/site-settings-server";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "dashboard.view");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const period = parseAnalyticsPeriod(url.searchParams.get("period"));

  const supabase = createSupabaseAdminClient();
  const [widgets, navigation, modules] = await Promise.all([
    fetchAdminDashboardWidgets(supabase, period),
    fetchSiteNavigation(),
    fetchSiteModules(),
  ]);
  const moduleSnapshots = resolveProductModuleSnapshots(navigation, modules);
  const attention = moduleSnapshots.filter((module) =>
    ["not_published", "not_configured", "dependency_unavailable", "unavailable"].includes(module.status),
  );

  return NextResponse.json({
    widgets,
    moduleHealth: {
      total: moduleSnapshots.length,
      active: moduleSnapshots.filter((module) => module.status === "active").length,
      disabled: moduleSnapshots.filter((module) => module.status === "disabled").length,
      attention: attention.map((module) => ({
        id: module.id,
        label: module.label,
        status: module.status,
        reason: module.reason,
      })),
      checkedAt: new Date().toISOString(),
    },
  });
}
