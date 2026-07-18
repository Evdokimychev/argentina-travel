import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

describe("public form secondary rate limits", () => {
  it("protects guest waitlist writes by IP and hashed email", () => {
    const route = source("src/app/api/tours/[slug]/waitlist/route.ts");

    expect(route).toContain("tour-waitlist:ip:${ip}");
    expect(route).toContain('hashRateLimitIdentifier("tour-waitlist", email)');
    expect(route).toContain("tour-waitlist:email:${emailHash}");
    expect(route).toContain("rateLimitErrorResponse");
    expect(route).not.toContain("tour-waitlist:email:${email}");
  });

  it("protects password-reset delivery by IP and hashed email", () => {
    const route = source("src/app/api/auth/request-password-reset/route.ts");

    expect(route).toContain("auth:password-reset:ip:${ip}");
    expect(route).toContain('hashRateLimitIdentifier("auth-password-reset", email)');
    expect(route).toContain("auth:password-reset:email:${emailHash}");
    expect(route).toContain('code: "AUTH_RESET_RATE_LIMITED"');
    expect(route).not.toContain("auth:password-reset:email:${email}");
  });
});
