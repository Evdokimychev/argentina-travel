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

  it("uses the database as the only durable green source", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/lib/ops/ops-status.ts"),
      "utf8",
    );
    const migration = fs.readFileSync(
      path.join(process.cwd(), "supabase/migrations/20260717032000_admin_operations_queues.sql"),
      "utf8",
    );

    expect(source).toContain('source: "database"');
    expect(source).toContain("durable: true");
    expect(migration).toContain("create table if not exists public.ops_cron_runs");
    expect(migration).toContain("service role only");
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
