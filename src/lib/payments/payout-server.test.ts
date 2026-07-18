import { describe, expect, it, vi } from "vitest";
import type { PayoutRecordRow } from "@/types/payment-platform";
import { createPayoutBatch, summarizePayoutRecords } from "./payout-server";

function payout(
  id: string,
  amount: number,
  currency: string,
  status: PayoutRecordRow["status"],
): PayoutRecordRow {
  return {
    id,
    organizerUserId: "organizer-1",
    period: "2026-07",
    amount,
    currency,
    status,
    metadata: {},
    exportedAt: null,
    exportFileHash: null,
    createdAt: "2026-07-16T00:00:00.000Z",
    updatedAt: "2026-07-16T00:00:00.000Z",
  };
}

describe("payout summaries", () => {
  it("reports each settlement currency independently", () => {
    const result = summarizePayoutRecords([
      payout("rub-pending", 10_000, "RUB", "pending"),
      payout("rub-paid", 5_000, "RUB", "paid"),
      payout("ars-approved", 20_000, "ARS", "approved"),
      payout("usd-exported", 100, "USD", "exported"),
    ]);

    expect(result).toEqual({
      byCurrency: [
        expect.objectContaining({ currency: "RUB", totalPending: 10_000, totalCompleted: 5_000 }),
        expect.objectContaining({ currency: "ARS", totalApproved: 20_000 }),
        expect.objectContaining({ currency: "USD", totalExported: 100 }),
      ],
      recordCount: 4,
      invalidRecordCount: 0,
    });
  });

  it("does not present an unsupported currency as a valid total", () => {
    const result = summarizePayoutRecords([payout("invalid", 1, "BTC", "pending")]);

    expect(result.byCurrency).toEqual([]);
    expect(result.invalidRecordCount).toBe(1);
  });
});

describe("atomic payout creation", () => {
  it("passes actor and one explicit currency to the transactional claim", async () => {
    const rpc = vi.fn(async () => ({
      data: { payoutId: "11111111-1111-4111-8111-111111111111", snapshotCount: 2 },
      error: null,
    }));
    const row = {
      id: "11111111-1111-4111-8111-111111111111",
      organizer_user_id: "organizer-1",
      period: "2026-07",
      amount: 150,
      currency: "USD",
      status: "pending",
      metadata: {},
      approved_by: null,
      completed_at: null,
      admin_notes: null,
      exported_at: null,
      export_file_hash: null,
      created_by: "22222222-2222-4222-8222-222222222222",
      approved_at: null,
      exported_by: null,
      completed_by: null,
      cancelled_by: null,
      cancelled_at: null,
      created_at: "2026-07-17T00:00:00.000Z",
      updated_at: "2026-07-17T00:00:00.000Z",
    };
    const query: Record<string, unknown> = {};
    query.select = vi.fn(() => query);
    query.eq = vi.fn(() => query);
    query.single = vi.fn(async () => ({ data: row, error: null }));
    const client = { rpc, from: vi.fn(() => query) };

    const result = await createPayoutBatch(client as never, {
      organizerUserId: "organizer-1",
      currency: "USD",
      actorUserId: "22222222-2222-4222-8222-222222222222",
    });

    expect(result).toMatchObject({ ok: true, snapshotCount: 2 });
    expect(rpc).toHaveBeenCalledWith("create_payout_batch_atomic", {
      p_organizer_user_id: "organizer-1",
      p_currency: "USD",
      p_period: null,
      p_admin_notes: null,
      p_actor_user_id: "22222222-2222-4222-8222-222222222222",
    });
  });
});
