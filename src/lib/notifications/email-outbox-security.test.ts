import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("transactional email outbox", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src/lib/notifications/email-delivery.ts"),
    "utf8",
  );

  it("persists a message before attempting provider delivery", () => {
    const insertIndex = source.indexOf('.from("email_delivery_outbox")');
    const fetchIndex = source.indexOf("fetch(RESEND_ENDPOINT");
    expect(insertIndex).toBeGreaterThan(-1);
    expect(fetchIndex).toBeGreaterThan(-1);
    expect(source).toContain('"Idempotency-Key": row.id');
    expect(source).toContain('status: "delivered"');
    expect(source).toContain('status: attempts >= EMAIL_MAX_ATTEMPTS ? "dead" : "failed"');
  });

  it("has an authenticated retry route in daily maintenance", () => {
    const retryRoute = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/cron/notifications/email-retry/route.ts"),
      "utf8",
    );
    const maintenance = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/cron/platform-maintenance/route.ts"),
      "utf8",
    );
    expect(retryRoute).toContain("authorizeCronRequest(request)");
    expect(retryRoute).toContain("processEmailOutboxRetries");
    expect(retryRoute).toContain("fetchOutboxHealthSnapshot");
    expect(retryRoute).toContain("logCronResult(CRON_ROUTE");
    expect(retryRoute).toContain("durationMs: Date.now() - startedAt");
    expect(maintenance).toContain('/api/cron/notifications/email-retry');
  });
});
