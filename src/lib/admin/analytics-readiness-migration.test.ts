import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sql = fs.readFileSync(
  path.join(process.cwd(), "supabase/migrations/20260717047000_analytics_readiness_truth.sql"),
  "utf8",
).toLowerCase();

describe("analytics truth migration", () => {
  it("separates legacy events and locks browser writes", () => {
    expect(sql).toContain("default 'legacy_unverified'");
    expect(sql).toContain("ingestion_source = 'controlled_server'");
    expect(sql).toContain("revoke insert on public.analytics_events from anon, authenticated");
  });

  it("counts paid bookings from distinct completed ledger charges and published reviews", () => {
    expect(sql).toContain("count(distinct transaction.booking_id)");
    expect(sql).toContain("transaction.type = 'charge'");
    expect(sql).toContain("transaction.status = 'completed'");
    expect(sql).toContain("review.status = 'published'");
    expect(sql).not.toContain("booking.payment_status");
  });
});
