import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { approveRefundRequest } from "@/lib/payments/transaction-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PostBody = {
  adminNotes?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(request, "operations.bookings");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as PostBody;

  const supabase = createSupabaseAdminClient();
  const result = await approveRefundRequest(supabase, id, auth.actorId, body.adminNotes);

  if (!result.ok) {
    const status = result.code === "MP_NOT_CONFIGURED" ? 503 : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "payment.refund_approved",
    entityType: "payment_transaction",
    entityId: id,
    payload: { providerExecuted: result.providerExecuted },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({
    transaction: result.transaction,
    providerExecuted: result.providerExecuted,
  });
}
