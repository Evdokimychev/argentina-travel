import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("operations health contract", () => {
  it("does not report green when no cron history exists", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/lib/ops/ops-status.ts"),
      "utf8",
    );

    expect(source).toContain('const dataAvailable = source !== "none"');
    expect(source).toContain("const durable = false");
    expect(source).toContain("const ok = dataAvailable && durable && failingRoutes.length === 0");
  });

  it("includes outbox health and fails closed when it is unavailable", () => {
    const route = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/cron/ops/health-report/route.ts"),
      "utf8",
    );

    expect(route).toContain("fetchOutboxHealthSnapshot");
    expect(route).toContain('reasons: ["outbox_health_unavailable"]');
    expect(route).toContain("ok: false");
  });
});
