import { describe, expect, it } from "vitest";
import { fetchPublicHealthSnapshotForTest } from "@/lib/monitoring/health-public";

type TestDependencies = Parameters<typeof fetchPublicHealthSnapshotForTest>[1];

function dependencies(
  overrides: Partial<TestDependencies> = {},
): TestDependencies {
  let clock = 0;
  return {
    isSupabaseConfigured: () => true,
    hasDirectPostgres: () => true,
    pingSupabase: async () => undefined,
    countSearchDocuments: async () => 42,
    pingPostgresDirect: async () => 17,
    now: () => {
      clock += 5;
      return clock;
    },
    ...overrides,
  };
}

describe("public health snapshot", () => {
  it("is healthy only when every required dependency is healthy", async () => {
    const snapshot = await fetchPublicHealthSnapshotForTest({}, dependencies());

    expect(snapshot.ok).toBe(true);
    expect(snapshot.status).toBe("ok");
    expect(snapshot.checks.database).toMatchObject({
      required: true,
      ok: true,
      skipped: false,
      error: null,
    });
    expect(snapshot.checks.postgresDirect).toMatchObject({
      required: true,
      ok: true,
      tripsterCount: 17,
    });
    expect(snapshot.checks.searchIndex).toMatchObject({
      required: false,
      ok: true,
      count: 42,
    });
    expect(snapshot.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
    expect(snapshot.checks.searchIndex.latencyMs).toBeGreaterThanOrEqual(0);
    expect(snapshot.checks.postgresDirect.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("does not hide a required Supabase failure behind a healthy direct connection", async () => {
    const snapshot = await fetchPublicHealthSnapshotForTest(
      {},
      dependencies({
        pingSupabase: async () => {
          throw new Error("internal host and credentials must not be public");
        },
      }),
    );

    expect(snapshot.ok).toBe(false);
    expect(snapshot.status).toBe("degraded");
    expect(snapshot.checks.database.error).toBe("dependency_unavailable");
    expect(snapshot.checks.postgresDirect.ok).toBe(true);
    expect(JSON.stringify(snapshot)).not.toContain("credentials must not be public");
  });

  it("reports down when all required database paths are unavailable", async () => {
    const snapshot = await fetchPublicHealthSnapshotForTest(
      {},
      dependencies({
        pingSupabase: async () => {
          throw new Error("Supabase unavailable");
        },
        pingPostgresDirect: async () => {
          throw new Error("Postgres unavailable");
        },
      }),
    );

    expect(snapshot.ok).toBe(false);
    expect(snapshot.status).toBe("down");
    expect(snapshot.checks.database.error).toBe("dependency_unavailable");
    expect(snapshot.checks.postgresDirect.error).toBe("dependency_unavailable");
  });

  it("keeps optional search degradation visible without declaring the site down", async () => {
    const snapshot = await fetchPublicHealthSnapshotForTest(
      {},
      dependencies({
        countSearchDocuments: async () => {
          throw new Error("search relation details must stay private");
        },
      }),
    );

    expect(snapshot.ok).toBe(true);
    expect(snapshot.status).toBe("degraded");
    expect(snapshot.checks.searchIndex).toMatchObject({
      required: false,
      ok: false,
      skipped: false,
      error: "dependency_unavailable",
      count: null,
    });
    expect(JSON.stringify(snapshot)).not.toContain("search relation details");
  });

  it("marks missing required configuration explicitly instead of treating it as healthy", async () => {
    const snapshot = await fetchPublicHealthSnapshotForTest(
      {},
      dependencies({
        isSupabaseConfigured: () => false,
        hasDirectPostgres: () => false,
      }),
    );

    expect(snapshot.ok).toBe(false);
    expect(snapshot.status).toBe("down");
    expect(snapshot.checks.database).toMatchObject({
      required: true,
      ok: false,
      skipped: true,
      error: "not_configured",
    });
    expect(snapshot.checks.postgresDirect.error).toBe("not_configured");
  });
});
