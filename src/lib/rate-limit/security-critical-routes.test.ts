import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

function usesSecurityCriticalLimit(routeSource: string): boolean {
  return (
    routeSource.includes("checkSecurityRateLimit") ||
    routeSource.includes('policy: "security_critical"')
  );
}

const SECURITY_CRITICAL_ROUTES = [
  "src/app/api/auth/register/route.ts",
  "src/app/api/auth/sign-in-phone/route.ts",
  "src/app/api/auth/lookup-phone/route.ts",
  "src/app/api/auth/lookup-email/route.ts",
  "src/app/api/auth/login-email/route.ts",
  "src/app/api/auth/login-by-phone/route.ts",
  "src/app/api/auth/ensure-profile/route.ts",
  "src/app/api/auth/request-password-reset/route.ts",
  "src/app/api/bookings/route.ts",
  "src/app/api/bookings/lookup/route.ts",
  "src/app/api/bookings/lookup/verify/route.ts",
  "src/app/api/contact/route.ts",
  "src/app/api/newsletter/route.ts",
  "src/app/api/organizer-applications/route.ts",
  "src/app/api/excursions/[slug]/book/route.ts",
  "src/app/api/tours/[slug]/waitlist/route.ts",
  "src/app/api/tripster/booking-request/route.ts",
  "src/app/api/youtravel/booking-request/route.ts",
  "src/app/api/shop/orders/route.ts",
] as const;

describe("security-critical rate-limit source contract", () => {
  it.each(SECURITY_CRITICAL_ROUTES)("%s fails closed when the distributed limiter is down", (relativePath) => {
    expect(usesSecurityCriticalLimit(source(relativePath))).toBe(true);
  });

  it("does not treat in-memory fallback as production-global protection in the contract docs", () => {
    const docs = source("docs/rate-limit-e87.md");
    expect(docs).toContain("security_critical");
    expect(docs).toContain("in-memory limiter is not production-global protection");
  });
});
