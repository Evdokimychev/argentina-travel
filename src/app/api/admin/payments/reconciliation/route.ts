import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { parseAnalyticsPeriod } from "@/lib/admin/analytics-period";
import {
  buildReconciliationSummary,
  createReconciliationSnapshot,
  listReconciliationSnapshots,
} from "@/lib/payments/reconciliation-server";
import { listPayoutRecords, summarizePayoutRecords } from "@/lib/payments/payout-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.bookings");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const period = parseAnalyticsPeriod(url.searchParams.get("period"));
  const includeSnapshots = url.searchParams.get("snapshots") === "1";

  const supabase = createSupabaseAdminClient();
  const summary = await buildReconciliationSummary(supabase, period);
  const payouts = await listPayoutRecords(supabase, { period });
  const payoutSummary = summarizePayoutRecords(payouts);
  const snapshots = includeSnapshots
    ? await listReconciliationSnapshots(supabase, period)
    : undefined;

  return NextResponse.json({
    period,
    totals: summary.totals,
    discrepancies: summary.discrepancies,
    payoutSummary,
    payouts,
    snapshots,
  });
}

type PostBody = {
  action?: "snapshot";
  notes?: string;
};

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.bookings");
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as PostBody;
  if (body.action !== "snapshot") {
    return NextResponse.json({ error: "Недопустимое действие" }, { status: 400 });
  }

  const url = new URL(request.url);
  const period = parseAnalyticsPeriod(url.searchParams.get("period"));

  const supabase = createSupabaseAdminClient();
  const snapshot = await createReconciliationSnapshot(supabase, {
    period,
    createdBy: auth.actorId,
    notes: body.notes,
  });

  if (!snapshot) {
    return NextResponse.json({ error: "Не удалось сохранить снимок сверки" }, { status: 500 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "payment.reconciliation_snapshot",
    entityType: "payment_audit_log",
    entityId: snapshot.id,
    payload: { period, totals: snapshot.totals },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ snapshot });
}
