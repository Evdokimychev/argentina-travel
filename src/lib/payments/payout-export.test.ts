import { describe, expect, it, vi } from "vitest";
import type { PayoutRecordRow } from "@/types/payment-platform";
import { buildPayoutBatchCsv } from "./payout-export";

const payout: PayoutRecordRow = {
  id: "payout-1",
  organizerUserId: "organizer-1",
  period: "2026-07",
  amount: 90,
  currency: "USD",
  status: "approved",
  metadata: {},
  exportedAt: null,
  exportFileHash: null,
  createdAt: "2026-07-16T00:00:00.000Z",
  updatedAt: "2026-07-16T00:00:00.000Z",
};

function profileQuery() {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(async () => ({
    data: { first_name: "Иван", last_name: "Петров", email: "owner@example.test" },
  }));
  return chain;
}

function snapshotQuery(currency: string) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.order = vi.fn(async () => ({
    data: [
      {
        booking_id: "booking-1",
        gross_amount: 100,
        commission_amount: 10,
        organizer_net_amount: 90,
        commission_percent: 10,
        commission_fixed: null,
        currency,
        created_at: "2026-07-16T00:00:00.000Z",
        bookings: { tour_title: "Тестовый тур" },
      },
    ],
  }));
  return chain;
}

function clientFor(currency: string) {
  return {
    from: vi
      .fn()
      .mockReturnValueOnce(profileQuery())
      .mockReturnValueOnce(snapshotQuery(currency)),
  };
}

describe("payout batch export", () => {
  it("exports a batch whose linked snapshots use the batch currency", async () => {
    const csv = await buildPayoutBatchCsv(clientFor("USD") as never, payout);

    expect(csv).toContain("payout-1");
    expect(csv).toContain("USD");
  });

  it("fails closed when a linked snapshot uses another currency", async () => {
    await expect(buildPayoutBatchCsv(clientFor("ARS") as never, payout)).rejects.toThrow(
      "другой валюте",
    );
  });
});
