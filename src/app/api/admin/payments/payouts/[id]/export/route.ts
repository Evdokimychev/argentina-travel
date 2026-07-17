import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { payoutBatchExportFilename } from "@/lib/payments/payout-export";
import { downloadPayoutBatch, exportPayoutBatch } from "@/lib/payments/payout-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

function csvResponse(result: Extract<Awaited<ReturnType<typeof exportPayoutBatch>>, { ok: true }>) {
  return new NextResponse(result.csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${payoutBatchExportFilename(result.payout)}"`,
      "X-Payout-Export-Hash": result.fileHash,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

export async function GET(request: Request, context: RouteContext) {
  const auth = await authorizeAdminRequest(request, "finance.payouts.export");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const payoutId = id?.trim();
  if (!payoutId) {
    return NextResponse.json({ error: "Не указан идентификатор пакета" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const result = await downloadPayoutBatch(supabase, payoutId);

  if (!result.ok) {
    const status = result.code === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return csvResponse(result);
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await authorizeAdminRequest(request, "finance.payouts.export");
  if (!auth.ok) return auth.response;
  if (auth.via !== "session") {
    return NextResponse.json({ error: "Финансовые операции требуют личную сессию" }, { status: 403 });
  }

  const { id } = await context.params;
  const payoutId = id?.trim();
  if (!payoutId) {
    return NextResponse.json({ error: "Не указан идентификатор пакета" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const result = await exportPayoutBatch(supabase, payoutId, auth.actorId);
  if (!result.ok) {
    const status = result.code === "NOT_FOUND" ? 404 : 409;
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  return csvResponse(result);
}
