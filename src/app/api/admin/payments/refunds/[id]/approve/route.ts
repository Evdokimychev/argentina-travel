import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { approveRefundRequest } from "@/lib/payments/transaction-server";
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
  const result = await approveRefundRequest(supabase, id, auth.actorId, body.adminNotes);

  if (!result.ok) {
    const status =
      result.code === "MP_NOT_CONFIGURED" || result.code === "STRIPE_NOT_CONFIGURED" ? 503 : 400;
    return NextResponse.json({ error: result.error, code: result.code }, { status });
  }

  return NextResponse.json({
    transaction: result.transaction,
    providerExecuted: result.providerExecuted,
  });
}
