import { NextResponse } from "next/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { parseAnalyticsPeriod } from "@/lib/admin/analytics-period";
import {
  buildOrganizerStatementCsv,
  organizerStatementFilename,
} from "@/lib/payments/payout-export";
import { listPayoutRecords } from "@/lib/payments/payout-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { userHasAccountRole } from "@/types/user";

export async function GET(request: Request) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Финансовый API недоступен" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
      return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
    }

    const url = new URL(request.url);
    const period = parseAnalyticsPeriod(url.searchParams.get("period"));
    const payouts = await listPayoutRecords(supabase, {
      organizerUserId: sessionUser.id,
      period,
    });
    const csv = await buildOrganizerStatementCsv(supabase, sessionUser.id, period, payouts);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${organizerStatementFilename(period)}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Неожиданная ошибка" },
      { status: 500 }
    );
  }
}
