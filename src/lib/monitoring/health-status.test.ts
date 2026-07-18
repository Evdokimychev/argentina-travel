import { describe, expect, it } from "vitest";
import { resolvePublicDatabaseHealth } from "./health-status";

describe("resolvePublicDatabaseHealth", () => {
  it("is healthy only when both database checks ran and passed", () => {
    expect(
      resolvePublicDatabaseHealth({
        database: { ok: true, skipped: false },
        postgresDirect: { ok: true },
      }),
    ).toBe(true);
  });

  it.each([
    {
      label: "Supabase configuration is missing",
      database: { ok: true, skipped: true },
      postgresDirect: { ok: true },
    },
    {
      label: "Supabase database check failed",
      database: { ok: false, skipped: false },
      postgresDirect: { ok: true },
    },
    {
      label: "direct Postgres check failed",
      database: { ok: true, skipped: false },
      postgresDirect: { ok: false },
    },
    {
      label: "both database paths are unavailable",
      database: { ok: false, skipped: true },
      postgresDirect: { ok: false },
    },
  ])("fails closed when $label", ({ database, postgresDirect }) => {
    expect(resolvePublicDatabaseHealth({ database, postgresDirect })).toBe(false);
  });
});
