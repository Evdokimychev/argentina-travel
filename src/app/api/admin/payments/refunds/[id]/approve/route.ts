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
    if (result.code === "NOT_FOUND") {
      return NextResponse.json({ error: "Запрос на возврат не найден", code: result.code }, { status: 404 });
    }
    if (result.code === "MP_NOT_CONFIGURED" || result.code === "STRIPE_NOT_CONFIGURED") {
      return NextResponse.json(
        { error: "Провайдер возврата временно не настроен", code: result.code },
        { status: 503 },
      );
    }
    if (result.code === "MP_FAILED" || result.code === "STRIPE_FAILED") {
      return NextResponse.json(
        {
          error: "Провайдер не подтвердил возврат. Операция сохранена для финансовой сверки.",
          code: result.code,
        },
        { status: 502 },
      );
    }
    return NextResponse.json({ error: result.error, code: result.code }, { status: 409 });
  }

  return NextResponse.json({
    transaction: result.transaction,
    providerExecuted: result.providerExecuted,
  });
}
