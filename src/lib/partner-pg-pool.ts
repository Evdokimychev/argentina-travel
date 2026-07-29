import "server-only";

import pg from "pg";
import {
  createPgClientConfig,
  resolveDatabaseConnection,
} from "@/lib/database-url";

const PARTNER_PG_POOL_MAX = 2;
const PARTNER_PG_IDLE_TIMEOUT_MS = 10_000;
const PARTNER_PG_QUERY_TIMEOUT_MS = 8_000;

type PartnerPgPoolState = {
  connectionString: string;
  pool: pg.Pool;
};

const globalPartnerPg = globalThis as typeof globalThis & {
  __goArgentinaPartnerPgPool?: PartnerPgPoolState;
};

function reportIdlePoolError(error: Error): void {
  const code = "code" in error && typeof error.code === "string" ? error.code : "unknown";
  console.error("[partner_pg_pool_idle_error]", { code });
}

function createPartnerPgPool(connectionString: string): pg.Pool {
  const pool = new pg.Pool({
    ...createPgClientConfig(connectionString),
    max: PARTNER_PG_POOL_MAX,
    idleTimeoutMillis: PARTNER_PG_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: PARTNER_PG_QUERY_TIMEOUT_MS,
    query_timeout: PARTNER_PG_QUERY_TIMEOUT_MS,
    statement_timeout: PARTNER_PG_QUERY_TIMEOUT_MS,
    allowExitOnIdle: true,
  });
  pool.on("error", reportIdlePoolError);
  return pool;
}

function getPartnerPgPool(): pg.Pool {
  const connection = resolveDatabaseConnection();
  if (!connection) {
    throw new Error("Attested Postgres is not configured for partner fallback");
  }

  const current = globalPartnerPg.__goArgentinaPartnerPgPool;
  if (current?.connectionString === connection.connectionString) {
    return current.pool;
  }

  if (current) {
    void current.pool.end().catch(() => undefined);
  }

  const pool = createPartnerPgPool(connection.connectionString);
  globalPartnerPg.__goArgentinaPartnerPgPool = {
    connectionString: connection.connectionString,
    pool,
  };
  return pool;
}

export async function withPartnerPgClient<T>(
  operation: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPartnerPgPool().connect();
  try {
    return await operation(client);
  } finally {
    client.release();
  }
}
