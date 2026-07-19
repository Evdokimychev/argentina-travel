import { NextResponse } from "next/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import {
  buildOrganizerAnalyticsCsv,
  getOrganizerAnalyticsServerReport,
  organizerAnalyticsFilename,
  parseOrganizerAnalyticsPeriod,
} from "@/lib/organizer/analytics-server";
import {
  guardOrganizerEntitlement,
  resolveOrganizerCommercialContract,
} from "@/lib/commercial/entitlement-resolver-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { userHasAccountRole } from "@/types/user";

export async function GET(request: Request) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json(
      { error: "Серверная аналитика недоступна без Supabase" },
      { status: 503 }
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    const url = new URL(request.url);
    const period = parseOrganizerAnalyticsPeriod(url.searchParams.get("period"));
    const format = url.searchParams.get("format");
    const commercialContract = await resolveOrganizerCommercialContract(
      createSupabaseAdminClient(),
      sessionUser.id
    );
    const basicAccess = guardOrganizerEntitlement(
      commercialContract,
      "analytics.basic"
    );

    if (!basicAccess.allowed) {
      const unavailable = basicAccess.reason === "contract_unavailable";
      return NextResponse.json(
        {
          error: unavailable
            ? "Не удалось безопасно проверить тариф. Повторите попытку позже."
            : "Аналитика не входит в текущий тариф.",
          code: basicAccess.reason,
        },
        { status: unavailable ? 503 : 403 }
      );
    }

    const report = await getOrganizerAnalyticsServerReport(
      supabase,
      sessionUser.id,
      period
    );

    if (format === "csv") {
      const exportAccess = guardOrganizerEntitlement(
        commercialContract,
        "analytics.export"
      );
      if (!exportAccess.allowed) {
        return NextResponse.json(
          {
            error: "Экспорт CSV не входит в текущий тариф.",
            code: exportAccess.reason,
          },
          { status: exportAccess.reason === "contract_unavailable" ? 503 : 403 }
        );
      }
      const csv = buildOrganizerAnalyticsCsv(report);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${organizerAnalyticsFilename(period)}"`,
        },
      });
    }

    const advancedAccess = guardOrganizerEntitlement(
      commercialContract,
      "analytics.advanced"
    );
    const exportAccess = guardOrganizerEntitlement(
      commercialContract,
      "analytics.export"
    );

    return NextResponse.json({
      report: {
        period: report.period,
        generatedAt: report.generatedAt,
        summary: report.summary,
      },
      advanced: advancedAccess.allowed
        ? { funnel: report.funnel, topTours: report.topTours }
        : null,
      commercial: {
        plan: commercialContract.plan
          ? {
              code: commercialContract.plan.code,
              version: commercialContract.plan.version,
              name: commercialContract.plan.name,
            }
          : null,
        canUseAdvancedAnalytics: advancedAccess.allowed,
        canExportCsv: exportAccess.allowed,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Неожиданная ошибка" },
      { status: 500 }
    );
  }
}
