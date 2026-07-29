import "server-only";

import type { ClientConfig } from "pg";

/**
 * Resolve Postgres connection string for server-side fallbacks when Supabase REST
 * is unavailable (egress quota, outage). Vercel Supabase integration exposes
 * POSTGRES_* vars; local dev typically uses DATABASE_URL.
 *
 * node-postgres must use Supavisor **session** mode (port 5432). Transaction pooler
 * (6543) often fails for ad-hoc queries in serverless.
 */
function buildDatabaseUrlFromParts(): string | null {
  const host = process.env.POSTGRES_HOST?.trim();
  const user = process.env.POSTGRES_USER?.trim();
  const password = process.env.POSTGRES_PASSWORD?.trim();
  const database = process.env.POSTGRES_DATABASE?.trim() || "postgres";

  if (!host || !user || !password) return null;

  const port = host.includes("pooler.supabase.com") ? "5432" : "5432";
  return preferPgSessionPoolerUrl(
    `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`,
  );
}

function isUsableDatabaseUrl(value: string | undefined): value is string {
  const trimmed = value?.trim();
  return Boolean(trimmed && trimmed !== '""' && trimmed !== "''");
}

export type DatabaseConnectionDiagnostics = {
  source: "POSTGRES_URL" | "POSTGRES_PRISMA_URL" | "DATABASE_URL" | "POSTGRES_URL_NON_POOLING" | "POSTGRES_PARTS";
  mode: "supabase_direct" | "supabase_session_pooler" | "other";
  port: number | null;
  projectRef: string | null;
};

function diagnosticsFor(source: DatabaseConnectionDiagnostics["source"], value: string): DatabaseConnectionDiagnostics {
  try {
    const parsed = new URL(value);
    const pooler = parsed.hostname.includes("pooler.supabase.com");
    const directMatch = parsed.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
    const userMatch = decodeURIComponent(parsed.username).match(/^postgres\.([a-z0-9]+)$/i);
    return {
      source,
      mode: pooler ? "supabase_session_pooler" : directMatch ? "supabase_direct" : "other",
      port: parsed.port ? Number.parseInt(parsed.port, 10) : null,
      projectRef: directMatch?.[1] ?? userMatch?.[1] ?? null,
    };
  } catch {
    return { source, mode: "other", port: null, projectRef: null };
  }
}

export function resolveDatabaseConnection(): {
  connectionString: string;
  diagnostics: DatabaseConnectionDiagnostics;
} | null {
  const candidates: Array<[DatabaseConnectionDiagnostics["source"], string | undefined]> = [
    ["POSTGRES_URL", process.env.POSTGRES_URL],
    ["POSTGRES_PRISMA_URL", process.env.POSTGRES_PRISMA_URL],
    ["DATABASE_URL", process.env.DATABASE_URL],
    ["POSTGRES_URL_NON_POOLING", process.env.POSTGRES_URL_NON_POOLING],
  ];

  for (const [source, value] of candidates) {
    if (isUsableDatabaseUrl(value)) {
      const connectionString = preferPgSessionPoolerUrl(value);
      return { connectionString, diagnostics: diagnosticsFor(source, connectionString) };
    }
  }

  const connectionString = buildDatabaseUrlFromParts();
  return connectionString
    ? { connectionString, diagnostics: diagnosticsFor("POSTGRES_PARTS", connectionString) }
    : null;
}

export function resolveDatabaseUrl(): string | null {
  return resolveDatabaseConnection()?.connectionString ?? null;
}

export function resolveDatabaseConnectionDiagnostics(): DatabaseConnectionDiagnostics | null {
  return resolveDatabaseConnection()?.diagnostics ?? null;
}

function preferPgSessionPoolerUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (
      parsed.port === "6543" &&
      parsed.hostname.includes("pooler.supabase.com")
    ) {
      parsed.port = "5432";
      return parsed.toString();
    }
  } catch {
    // keep original string
  }
  return url;
}

/** Shared pg client options — Supabase pooler uses a chain Vercel Node rejects by default. */
export function createPgClientConfig(connectionString: string): ClientConfig {
  return {
    connectionString,
    ssl: {
      rejectUnauthorized: false,
      checkServerIdentity: () => undefined,
    },
    connectionTimeoutMillis: 10_000,
  };
}
