import { NextResponse } from "next/server";
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
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ transaction: result.transaction });
}
