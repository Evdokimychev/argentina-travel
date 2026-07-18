import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("admin operations P0 contracts", () => {
  it("closes direct analytics inserts and exposes controlled ingestion", () => {
    const migration = fs.readFileSync(
      path.join(root, "supabase/migrations/20260717032000_admin_operations_queues.sql"),
      "utf8",
    );
    const route = fs.readFileSync(
      path.join(root, "src/app/api/analytics/events/route.ts"),
      "utf8",
    );
    expect(migration).toContain("revoke insert on public.analytics_events from anon, authenticated");
    expect(route).toContain('body.eventType !== "tour_view"');
    expect(route).toContain("checkRateLimit");
    expect(route).not.toContain("userId:");
  });

  it("keeps email bodies and recipient values out of the admin response", () => {
    const route = fs.readFileSync(
      path.join(root, "src/app/api/admin/ops/email-outbox/route.ts"),
      "utf8",
    );
    const responseProjection = route.slice(route.indexOf("const items"));
    expect(responseProjection).not.toContain("html_body");
    expect(responseProjection).not.toContain("text_body");
    expect(responseProjection).not.toContain("recipients: row.recipients");
    expect(responseProjection).toContain("recipientCount");
    expect(route).toContain('"operations.email"');
    expect(route).toContain('auth.via !== "session"');
    expect(route).toContain("body?.confirm !== true");
    expect(route).toContain("safeDeliveryFailure");
    expect(responseProjection).not.toContain("row.last_error.slice");
  });

  it("uses optimistic concurrency for waitlist transitions", () => {
    const migration = fs.readFileSync(
      path.join(root, "supabase/migrations/20260717032000_admin_operations_queues.sql"),
      "utf8",
    );
    expect(migration).toContain("p_expected_version integer");
    expect(migration).toContain("for update");
    expect(migration).toContain("waitlist_version_conflict");
    expect(migration).toContain("converted_booking_required");
  });

  it("requires owner confirmation before external email and finance effects", () => {
    const emailQueue = fs.readFileSync(path.join(root, "src/components/admin/views/AdminEmailQueueView.tsx"), "utf8");
    const ledger = fs.readFileSync(path.join(root, "src/components/admin/views/AdminPaymentLedgerView.tsx"), "utf8");
    const payouts = fs.readFileSync(path.join(root, "src/components/admin/views/AdminPayoutsView.tsx"), "utf8");
    expect(emailQueue).toContain("window.confirm");
    expect(emailQueue).toContain("confirm: true");
    expect(ledger.match(/window\.confirm/g)?.length).toBeGreaterThanOrEqual(2);
    expect(payouts.match(/window\.confirm/g)?.length).toBeGreaterThanOrEqual(2);
  });
});
