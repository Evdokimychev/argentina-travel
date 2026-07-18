import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260717031000_finance_atomic_controls.sql"
  ),
  "utf8"
).toLowerCase();

describe("atomic finance migration contract", () => {
  it("serializes concurrent refund reservations and enforces cumulative caps", () => {
    expect(migration).toContain("for update");
    expect(migration).toContain("payment_refund_idempotency_key_idx");
    expect(migration).toContain("payment_refund_active_source_idx");
    expect(migration).toContain("status in ('pending', 'processing', 'completed')");
    expect(migration).toContain("refund_exceeds_remaining_charge");
    expect(migration).toContain("where id = p_refund_id and status = 'pending'");
  });

  it("claims payout snapshots once and never mixes currencies", () => {
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("currency = v_currency");
    expect(migration).toContain("for update");
    expect(migration).toContain("payout_snapshot_claim_conflict");
    expect(migration).toContain("currency in ('rub', 'ars', 'usd', 'eur')");
  });

  it("enforces four-eyes approval and keeps lifecycle actors separate", () => {
    expect(migration).toContain("refund_maker_cannot_approve");
    expect(migration).toContain("created_by is distinct from p_actor_user_id");
    expect(migration).toContain("payout_records_maker_approver_check");
    expect(migration).toContain("completed_by = p_actor_user_id");
    expect(migration).not.toContain("set status = 'completed',\n      approved_by = p_actor_user_id");
  });

  it("uses compare-and-set transitions and service-role-only RPC grants", () => {
    expect(migration).toContain("where id = p_payout_id and status = 'approved'");
    expect(migration).toContain("where id = p_payout_id and status = 'exported'");
    expect(migration).toContain("revoke all on function public.create_payout_batch_atomic");
    expect(migration).toContain("grant execute on function public.create_payout_batch_atomic");
    expect(migration).toContain("to service_role");
  });

  it("writes audit events inside the same database transaction", () => {
    expect(migration.match(/insert into public\.admin_audit_log/g)?.length).toBeGreaterThanOrEqual(8);
    expect(migration).toContain("payment.refund_prepared");
    expect(migration).toContain("payout.batch_created");
  });
});

describe("refund preparation route contract", () => {
  const adminRoute = readFileSync(
    join(process.cwd(), "src/app/api/admin/payments/refund/route.ts"),
    "utf8"
  );
  const organizerRoute = readFileSync(
    join(process.cwd(), "src/app/api/organizer/payments/refund-request/route.ts"),
    "utf8"
  );

  it("never calls a payment provider while preparing a refund", () => {
    expect(adminRoute).not.toContain("executeRefundAttempt");
    expect(organizerRoute).not.toContain("executeRefundAttempt");
    expect(adminRoute).toContain('"finance.refunds.prepare"');
    expect(adminRoute).toContain('nextStep: "approval_required"');
  });
});
