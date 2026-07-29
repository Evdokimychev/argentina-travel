import "server-only";

import type { ClientConfig } from "pg";
import {
  supabaseProjectRefFromDatabaseUrl,
  supabaseProjectRefFromUrl,
} from "@/lib/supabase/project-ref";

/**
 * Resolve Postgres connection string for server-side fallbacks when Supabase REST
 * is unavailable (egress quota, outage). Vercel Supabase integration exposes
 * POSTGRES_* vars; local dev typically uses DATABASE_URL.
 *
 * Supabase recommends transaction mode (port 6543) for temporary serverless
 * clients. Preserve the configured, attested connection mode instead of
 * silently converting it to a session connection that reserves a backend slot.
 */
function buildDatabaseUrlFromParts(): string | null {
  const host = process.env.POSTGRES_HOST?.trim();
  const user = process.env.POSTGRES_USER?.trim();
  const password = process.env.POSTGRES_PASSWORD?.trim();
  const database = process.env.POSTGRES_DATABASE?.trim() || "postgres";

  if (!host || !user || !password) return null;

  const port = host.includes("pooler.supabase.com") ? "5432" : "5432";
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

function isUsableDatabaseUrl(value: string | undefined): value is string {
  const trimmed = value?.trim();
  return Boolean(trimmed && trimmed !== '""' && trimmed !== "''");
}

export type DatabaseConnectionDiagnostics = {
  source: "POSTGRES_URL" | "POSTGRES_PRISMA_URL" | "DATABASE_URL" | "POSTGRES_URL_NON_POOLING" | "POSTGRES_PARTS";
  mode:
    | "supabase_direct"
    | "supabase_session_pooler"
    | "supabase_transaction_pooler"
    | "other";
  port: number | null;
  projectRef: string | null;
  targetStatus: "verified" | "unverified" | "mismatch";
};

function expectedSupabaseProjectRef(): string | null {
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return publicUrl ? supabaseProjectRefFromUrl(publicUrl) : null;
}

function diagnosticsFor(
  source: DatabaseConnectionDiagnostics["source"],
  value: string,
  expectedProjectRef: string | null,
): DatabaseConnectionDiagnostics {
  try {
    const parsed = new URL(value);
    const pooler = /(^|\.)pooler\.supabase\.com$/.test(parsed.hostname.toLowerCase());
    const projectRef = supabaseProjectRefFromDatabaseUrl(value);
    return {
      source,
      mode: pooler
        ? parsed.port === "6543"
          ? "supabase_transaction_pooler"
          : "supabase_session_pooler"
        : parsed.hostname.toLowerCase().startsWith("db.") && projectRef
          ? "supabase_direct"
          : "other",
      port: parsed.port ? Number.parseInt(parsed.port, 10) : null,
      projectRef,
      targetStatus: !expectedProjectRef
        ? "unverified"
        : !projectRef
          ? "unverified"
          : projectRef === expectedProjectRef
            ? "verified"
            : "mismatch",
    };
  } catch {
    return {
      source,
      mode: "other",
      port: null,
      projectRef: null,
      targetStatus: "unverified",
    };
  }
}

type DatabaseConnectionResolution = {
  connectionString: string | null;
  diagnostics: DatabaseConnectionDiagnostics | null;
};

function resolveDatabaseConnectionState(): DatabaseConnectionResolution {
  const expectedProjectRef = expectedSupabaseProjectRef();
  let firstRejected: DatabaseConnectionDiagnostics | null = null;
  const candidates: Array<[DatabaseConnectionDiagnostics["source"], string | undefined]> = [
    ["POSTGRES_URL", process.env.POSTGRES_URL],
    ["POSTGRES_PRISMA_URL", process.env.POSTGRES_PRISMA_URL],
    ["DATABASE_URL", process.env.DATABASE_URL],
    ["POSTGRES_URL_NON_POOLING", process.env.POSTGRES_URL_NON_POOLING],
  ];

  const fromParts = buildDatabaseUrlFromParts();
  if (fromParts) candidates.push(["POSTGRES_PARTS", fromParts]);

  for (const [source, value] of candidates) {
    if (!isUsableDatabaseUrl(value)) continue;

    const connectionString = value;
    const diagnostics = diagnosticsFor(source, connectionString, expectedProjectRef);
    if (diagnostics.targetStatus === "verified") {
      return { connectionString, diagnostics };
    }
    firstRejected ??= diagnostics;
  }

  return { connectionString: null, diagnostics: firstRejected };
}

export function resolveDatabaseConnection(): {
  connectionString: string;
  diagnostics: DatabaseConnectionDiagnostics;
} | null {
  const resolution = resolveDatabaseConnectionState();
  return resolution.connectionString && resolution.diagnostics
    ? {
        connectionString: resolution.connectionString,
        diagnostics: resolution.diagnostics,
      }
    : null;
}

export function resolveDatabaseUrl(): string | null {
  return resolveDatabaseConnection()?.connectionString ?? null;
}

export function resolveDatabaseConnectionDiagnostics(): DatabaseConnectionDiagnostics | null {
  return resolveDatabaseConnectionState().diagnostics;
}

export function isDatabaseUrlAttested(value: string | undefined): boolean {
  if (!isUsableDatabaseUrl(value)) return false;
  return diagnosticsFor("DATABASE_URL", value, expectedSupabaseProjectRef()).targetStatus === "verified";
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
