import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchPublicHealthSnapshot } = vi.hoisted(() => ({
  fetchPublicHealthSnapshot: vi.fn(),
}));

vi.mock("@/lib/monitoring/health-public", () => ({
  fetchPublicHealthSnapshot,
}));

import { GET } from "./route";

function snapshot(options?: {
  restOk?: boolean;
  postgresOk?: boolean;
}) {
  const restOk = options?.restOk ?? true;
  const postgresOk = options?.postgresOk ?? true;
  const ok = restOk && postgresOk;
  return {
    ok,
    status: ok ? "ok" : restOk || postgresOk ? "degraded" : "down",
    generatedAt: "2026-07-28T00:00:00.000Z",
    checks: {
      database: { ok: restOk, skipped: false, latencyMs: 12 },
      postgresDirect: {
        ok: postgresOk,
        skipped: false,
        latencyMs: 18,
        tripsterCount: postgresOk ? 42 : null,
      },
    },
  };
}

describe("GET /api/health/database", () => {
  beforeEach(() => {
    fetchPublicHealthSnapshot.mockReset();
  });

  it("returns 200 only when both required database paths are healthy", async () => {
    fetchPublicHealthSnapshot.mockResolvedValue(snapshot());

    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      status: "ok",
      serviceAvailable: true,
    });
  });

  it("returns 503 degraded when only the recovery path is available", async () => {
    fetchPublicHealthSnapshot.mockResolvedValue(
      snapshot({ restOk: false, postgresOk: true }),
    );

    const response = await GET();
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      status: "degraded",
      serviceAvailable: true,
    });
  });

  it("returns 503 down when no database path is available", async () => {
    fetchPublicHealthSnapshot.mockResolvedValue(
      snapshot({ restOk: false, postgresOk: false }),
    );

    const response = await GET();
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      status: "down",
      serviceAvailable: false,
    });
  });
});
