import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { parseAnalyticsPeriod } from "@/lib/admin/analytics-period";
import { buildCommissionReport } from "@/lib/payments/commission-server";
import {
  cancelPayoutBatch,
  createPayoutBatch,
  listPayoutRecords,
  markPayoutCompleted,
  summarizePayoutRecords,
} from "@/lib/payments/payout-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PayoutRecordStatus } from "@/types/payment-platform";

function parseStatus(value: string | null): PayoutRecordStatus | "all" {
  if (
    value === "pending" ||
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
  const auth = await authorizeAdminRequest(request, "operations.bookings");
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
  action?: "create_batch" | "complete" | "cancel";
  organizerUserId?: string;
  payoutId?: string;
  adminNotes?: string;
  period?: string;
};

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.bookings");
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as PostBody;
  const supabase = createSupabaseAdminClient();
  const adminUserId = auth.actorId;

  if (body.action === "create_batch") {
    const organizerUserId = body.organizerUserId?.trim();
    if (!organizerUserId) {
      return NextResponse.json({ error: "Укажите organizerUserId" }, { status: 400 });
    }

    const result = await createPayoutBatch(supabase, {
      organizerUserId,
      period: body.period,
      adminNotes: body.adminNotes,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });
    }

    await writeAdminAuditLog({
      actorUserId: adminUserId,
      action: "payout.batch_created",
      entityType: "payout_record",
      entityId: result.payout.id,
      payload: { organizerUserId, snapshotCount: result.snapshotCount, amount: result.payout.amount },
      ipAddress: clientIpFromRequest(request),
    });

    return NextResponse.json({
      payout: result.payout,
      snapshotCount: result.snapshotCount,
    });
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

    await writeAdminAuditLog({
      actorUserId: adminUserId,
      action: "payout.completed",
      entityType: "payout_record",
      entityId: payoutId,
      payload: { amount: result.payout.amount, organizerUserId: result.payout.organizerUserId },
      ipAddress: clientIpFromRequest(request),
    });

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

    await writeAdminAuditLog({
      actorUserId: adminUserId,
      action: "payout.cancelled",
      entityType: "payout_record",
      entityId: payoutId,
      ipAddress: clientIpFromRequest(request),
    });

    return NextResponse.json({ payout: result.payout });
  }

  return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
}
