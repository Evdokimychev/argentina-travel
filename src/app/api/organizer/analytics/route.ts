import { NextResponse } from "next/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import {
  buildOrganizerAnalyticsCsv,
  getOrganizerAnalyticsServerReport,
  organizerAnalyticsFilename,
  parseOrganizerAnalyticsPeriod,
} from "@/lib/organizer/analytics-server";
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
    const report = await getOrganizerAnalyticsServerReport(
      supabase,
      sessionUser.id,
      period
    );

    if (format === "csv") {
      const csv = buildOrganizerAnalyticsCsv(report);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${organizerAnalyticsFilename(period)}"`,
        },
      });
    }

    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Неожиданная ошибка" },
      { status: 500 }
    );
  }
}
