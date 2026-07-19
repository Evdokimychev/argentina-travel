import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Sentry operational verification route", () => {
  it("is admin-only and returns release evidence", () => {
    const route = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/admin/ops/sentry-test/route.ts"),
      "utf8",
    );
    const sentry = fs.readFileSync(
      path.join(process.cwd(), "src/lib/monitoring/sentry.ts"),
      "utf8",
    );

    expect(route).toContain("authorizeAdminRequest(request)");
    expect(route).toContain("captureOperationalTestException");
    expect(sentry).toContain('scope.setTag("release_sha", release)');
    expect(sentry).toContain("await Sentry.flush(2_000)");
  });
});
