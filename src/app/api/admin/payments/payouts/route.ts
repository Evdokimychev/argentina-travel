import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { parseAnalyticsPeriod } from "@/lib/admin/analytics-period";
import { buildCommissionReport } from "@/lib/payments/commission-server";
import {
  approvePayoutBatch,
  cancelPayoutBatch,
  createPayoutBatch,
  listPayoutRecords,
  markPayoutCompleted,
  summarizePayoutRecords,
} from "@/lib/payments/payout-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PayoutRecordStatus } from "@/types/payment-platform";
import { parseMoneyCurrency } from "@/lib/payments/money";

function parseStatus(value: string | null): PayoutRecordStatus | "all" {
  if (
    value === "pending" ||
    value === "approved" ||
    value === "exported" ||
    value === "completed" ||
    value === "scheduled" ||
    value === "paid" ||
    value === "failed" ||
    value === "cancelled"
  ) {
    return value;
  }
  return "all";
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "finance.view");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const period = parseAnalyticsPeriod(url.searchParams.get("period"));
  const status = parseStatus(url.searchParams.get("status"));
  const organizerUserId = url.searchParams.get("organizerUserId");

  const supabase = createSupabaseAdminClient();
  const payouts = await listPayoutRecords(supabase, {
    period,
    status,
    organizerUserId: organizerUserId ?? undefined,
  });
  const payoutSummary = summarizePayoutRecords(payouts);
  const commissionReport = await buildCommissionReport(supabase, period);

  return NextResponse.json({
    period,
    payouts,
    payoutSummary,
    commissionReport,
  });
}

type PostBody = {
  action?: "create_batch" | "approve" | "complete" | "cancel";
  organizerUserId?: string;
  payoutId?: string;
  adminNotes?: string;
  period?: string;
  currency?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as PostBody;
  const requiredCapability =
    body.action === "create_batch"
      ? "finance.payouts.create"
      : body.action === "approve" || body.action === "cancel"
        ? "finance.payouts.approve"
        : body.action === "complete"
          ? "finance.payouts.complete"
          : null;
  if (!requiredCapability) {
    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  }
  const auth = await authorizeAdminRequest(request, requiredCapability);
  if (!auth.ok) return auth.response;
  if (auth.via !== "session") {
    return NextResponse.json({ error: "Финансовые операции требуют личную сессию" }, { status: 403 });
  }

  const supabase = createSupabaseAdminClient();
  const adminUserId = auth.actorId;

  if (body.action === "create_batch") {
    const organizerUserId = body.organizerUserId?.trim();
    if (!organizerUserId) {
      return NextResponse.json({ error: "Укажите organizerUserId" }, { status: 400 });
    }
    const currency = parseMoneyCurrency(body.currency ?? "");
    if (!currency) {
      return NextResponse.json({ error: "Выберите валюту выплаты" }, { status: 400 });
    }

    const result = await createPayoutBatch(supabase, {
      organizerUserId,
      currency,
      period: body.period,
      adminNotes: body.adminNotes,
      actorUserId: adminUserId,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });
    }

    return NextResponse.json({
      payout: result.payout,
      snapshotCount: result.snapshotCount,
    });
  }

  if (body.action === "approve") {
    const payoutId = body.payoutId?.trim();
    if (!payoutId) {
      return NextResponse.json({ error: "Укажите payoutId" }, { status: 400 });
    }

    const result = await approvePayoutBatch(supabase, payoutId, adminUserId, body.adminNotes);

    if (!result.ok) {
      const status = result.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }

    return NextResponse.json({ payout: result.payout });
  }

  if (body.action === "complete") {
    const payoutId = body.payoutId?.trim();
    if (!payoutId) {
      return NextResponse.json({ error: "Укажите payoutId" }, { status: 400 });
    }

    const result = await markPayoutCompleted(supabase, payoutId, adminUserId, body.adminNotes);

    if (!result.ok) {
      const status = result.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }

    return NextResponse.json({ payout: result.payout });
  }

  if (body.action === "cancel") {
    const payoutId = body.payoutId?.trim();
    if (!payoutId) {
      return NextResponse.json({ error: "Укажите payoutId" }, { status: 400 });
    }

    const result = await cancelPayoutBatch(supabase, payoutId, adminUserId, body.adminNotes);

    if (!result.ok) {
      const status = result.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: result.error, code: result.code }, { status });
    }

    return NextResponse.json({ payout: result.payout });
  }

  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}
