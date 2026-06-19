import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { payoutBatchExportFilename } from "@/lib/payments/payout-export";
import { exportPayoutBatch } from "@/lib/payments/payout-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const auth = await authorizeAdminRequest(request, "operations.bookings");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const payoutId = id?.trim();
  if (!payoutId) {
    return NextResponse.json({ error: "Не указан идентификатор пакета" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const result = await exportPayoutBatch(supabase, payoutId);

  if (!result.ok) {
    const status = result.code === "NOT_FOUND" ? 404 : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  if (result.transitioned) {
    await writeAdminAuditLog({
      actorUserId: auth.actorId,
      action: "payout.exported",
      entityType: "payout_record",
      entityId: payoutId,
      payload: {
        fileHash: result.fileHash,
        organizerUserId: result.payout.organizerUserId,
        amount: result.payout.amount,
      },
      ipAddress: clientIpFromRequest(request),
    });
  }

  return new NextResponse(result.csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${payoutBatchExportFilename(result.payout)}"`,
      "X-Payout-Export-Hash": result.fileHash,
    },
  });
}
