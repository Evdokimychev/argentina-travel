import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const release = vi.fn();
  const client = { release };
  const connect = vi.fn(async () => client);
  const on = vi.fn();
  const end = vi.fn(async () => undefined);
  const Pool = vi.fn(function Pool(this: unknown) {
    return { connect, on, end };
  });
  return { Pool, connect, on, end, release, client };
});

vi.mock("pg", () => ({ default: { Pool: mocks.Pool } }));
vi.mock("@/lib/database-url", () => ({
  createPgClientConfig: vi.fn((connectionString: string) => ({ connectionString })),
  resolveDatabaseConnection: vi.fn(() => ({
    connectionString: "postgresql://attested.example:6543/postgres",
    diagnostics: { targetStatus: "verified" },
  })),
}));

describe("partner PostgreSQL pool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (globalThis as typeof globalThis & {
      __goArgentinaPartnerPgPool?: unknown;
    }).__goArgentinaPartnerPgPool;
  });

  it("reuses one bounded pool with connection and query deadlines", async () => {
    const { withPartnerPgClient } = await import("@/lib/partner-pg-pool");

    await withPartnerPgClient(async (client) => expect(client).toBe(mocks.client));
    await withPartnerPgClient(async () => "ok");

    expect(mocks.Pool).toHaveBeenCalledTimes(1);
    expect(mocks.Pool).toHaveBeenCalledWith(expect.objectContaining({
      connectionString: "postgresql://attested.example:6543/postgres",
      max: 2,
      connectionTimeoutMillis: 8_000,
      query_timeout: 8_000,
      statement_timeout: 8_000,
      allowExitOnIdle: true,
    }));
    expect(mocks.connect).toHaveBeenCalledTimes(2);
    expect(mocks.release).toHaveBeenCalledTimes(2);
  });

  it("always releases a checked-out client when the operation fails", async () => {
    const { withPartnerPgClient } = await import("@/lib/partner-pg-pool");

    await expect(withPartnerPgClient(async () => {
      throw new Error("query failed");
    })).rejects.toThrow("query failed");

    expect(mocks.release).toHaveBeenCalledOnce();
  });
});
