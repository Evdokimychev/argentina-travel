import { NextResponse } from "next/server";
import { clientIpFromRequest, writeCriticalAdminAuditLog } from "@/lib/admin/audit";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { rejectRefundRequest } from "@/lib/payments/transaction-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PostBody = {
  adminNotes?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(request, "finance.refunds.approve");
  if (!auth.ok) return auth.response;
  if (auth.via !== "session") {
    return NextResponse.json({ error: "Финансовые операции требуют личную сессию" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as PostBody;

  const supabase = createSupabaseAdminClient();
  const result = await rejectRefundRequest(supabase, id, auth.actorId, body.adminNotes);

  if ("error" in result) {
    return NextResponse.json(
      { error: "Запрос уже обработан либо должен быть проверен другим сотрудником" },
      { status: 409 },
    );
  }

  const audit = await writeCriticalAdminAuditLog({
    actorUserId: auth.actorId,
    action: "finance.refund.reject",
    entityType: "payment_transaction",
    entityId: id,
    payload: { hasAdminNotes: Boolean(body.adminNotes?.trim()) },
    ipAddress: clientIpFromRequest(request),
  });
  if (!audit.ok) {
    return NextResponse.json(
      { error: "Не удалось записать журнал безопасности. Повторите позже.", code: "AUDIT_WRITE_FAILED" },
      { status: 503 },
    );
  }

  return NextResponse.json({ transaction: result.transaction });
}
