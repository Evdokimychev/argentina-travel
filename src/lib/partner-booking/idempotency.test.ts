import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  fingerprintPartnerBookingRequest,
  isValidBookingOperationKey,
} from "@/lib/partner-booking/idempotency";

describe("partner booking idempotency", () => {
  it("accepts UUID operation keys and rejects arbitrary values", () => {
    expect(isValidBookingOperationKey("9a718c91-c463-4d2f-8e92-22c93492f2bd")).toBe(true);
    expect(isValidBookingOperationKey("same-order" )).toBe(false);
    expect(isValidBookingOperationKey(null)).toBe(false);
  });

  it("creates deterministic fingerprints and detects changed booking data", () => {
    const first = fingerprintPartnerBookingRequest({ slug: "tour", guests: 2 });
    expect(fingerprintPartnerBookingRequest({ slug: "tour", guests: 2 })).toBe(first);
    expect(fingerprintPartnerBookingRequest({ slug: "tour", guests: 3 })).not.toBe(first);
  });

  it("does not trust a client supplied user id in partner routes", () => {
    for (const file of [
      "src/app/api/tripster/booking-request/route.ts",
      "src/app/api/youtravel/booking-request/route.ts",
    ]) {
      const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
      expect(source).not.toContain("authUser?.id ?? body.userId");
      expect(source).toContain('request.headers.get("idempotency-key")');
    }
  });

  it("keeps the legacy excursion booking route fail-closed and replay-safe", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/excursions/[slug]/book/route.ts"),
      "utf8",
    );

    expect(source).toContain("ENABLE_PARTNER_CONTACT_FORM");
    expect(source.indexOf("!ENABLE_PARTNER_CONTACT_FORM")).toBeLessThan(
      source.indexOf("createTripsterExternalOrder("),
    );
    expect(source).toContain('request.headers.get("idempotency-key")');
    expect(source).toContain("claimPartnerBookingOperation");
    expect(source).toContain("completePartnerBookingOperation");
    expect(source).toContain("checkSecurityRateLimit(");
    expect(source).toContain("excursions:partner-booking:ip:");
    expect(source).toContain("affiliate_only");
    expect(source).not.toContain("createSputnik8Order");
    expect(source).not.toContain("randomUUID");
    expect(source).not.toContain("body.userId");
  });
});
