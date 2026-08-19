import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  resolveDatabaseUrl,
  resolveDatabaseConnectionDiagnostics,
  createPgClientConfig,
  type DatabaseConnectionDiagnostics,
} from "@/lib/database-url";
import { getAppVersion, getGitSha } from "@/lib/monitoring/build-info";
import pg from "pg";
import { getDeployEnvironment } from "@/lib/ops/deploy-env";
import { getLatestMigrationId, getMigrationFileCount } from "@/lib/ops/migrations-version";
import { classifyCmsPublicReadError } from "@/lib/cms/public-read-result";

export type PublicHealthStatus = "ok" | "degraded" | "down";
export type PublicHealthError =
  | "not_configured"
  | "target_unverified"
  | "target_mismatch"
  | "dependency_unavailable"
  | "dependency_timeout"
  | "dependency_quota"
  | "dependency_unreachable";

type DependencyCheck = {
  required: boolean;
  ok: boolean;
  skipped: boolean;
  latencyMs: number | null;
  error: PublicHealthError | null;
};

export type PublicHealthSnapshot = {
  ok: boolean;
  status: PublicHealthStatus;
  version: string;
  gitSha: string | null;
  environment: {
    nodeEnv: string;
    deployEnv: string;
  };
  migrationVersion: string | null;
  checks: {
    database: DependencyCheck;
    migrations: {
      latestId: string | null;
      fileCount: number;
    };
    searchIndex: DependencyCheck & {
      count: number | null;
    };
    postgresDirect: DependencyCheck & {
      tripsterCount: number | null;
      connection: DatabaseConnectionDiagnostics | null;
    };
  };
  generatedAt: string;
};

type ProbeDependencies = {
  isSupabaseConfigured: () => boolean;
  hasDirectPostgres: () => boolean;
  pingSupabase: () => Promise<void>;
  countSearchDocuments: () => Promise<number>;
  pingPostgresDirect: () => Promise<number>;
  describeDirectPostgres: () => DatabaseConnectionDiagnostics | null;
  now: () => number;
};

const HEALTH_TIMEOUT_MS = 5_000;

function dependencyError(error: unknown): PublicHealthError {
  if (error instanceof Error && error.name === "HealthProbeTimeoutError") {
    return "dependency_timeout";
  }
  if (classifyCmsPublicReadError(error) === "quota") {
    return "dependency_quota";
  }
  const text = [
    error instanceof Error ? error.message : "",
    error instanceof Error ? error.name : "",
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code)
      : "",
  ]
    .join(" ")
    .toLowerCase();
  if (
    /enetunreach|ehostunreach|network is unreachable|eafnosupport/.test(text)
  ) {
    return "dependency_unreachable";
  }
  return "dependency_unavailable";
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      const error = new Error("Health dependency timed out");
      error.name = "HealthProbeTimeoutError";
      reject(error);
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

async function runProbe<T>(
  probe: () => Promise<T>,
  now: () => number,
): Promise<{ ok: true; value: T; latencyMs: number } | { ok: false; error: PublicHealthError; latencyMs: number }> {
  const startedAt = now();
  try {
    const value = await withTimeout(probe(), HEALTH_TIMEOUT_MS);
    return { ok: true, value, latencyMs: Math.max(0, now() - startedAt) };
  } catch (error) {
    return {
      ok: false,
      error: dependencyError(error),
      latencyMs: Math.max(0, now() - startedAt),
    };
  }
}

function resolveOverallHealth(checks: DependencyCheck[]): {
  ok: boolean;
  status: PublicHealthStatus;
} {
  const required = checks.filter((check) => check.required);
  const failedRequired = required.filter((check) => !check.ok);
  const failedOptional = checks.filter(
    (check) => !check.required && !check.ok && !check.skipped,
  );

  if (required.length > 0 && failedRequired.length === required.length) {
    return { ok: false, status: "down" };
  }
  if (failedRequired.length > 0) {
    return { ok: false, status: "degraded" };
  }
  if (failedOptional.length > 0) {
    return { ok: true, status: "degraded" };
  }
  return { ok: true, status: "ok" };
}

async function defaultPingSupabase(): Promise<void> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("profiles").select("id").limit(1);
  if (error) throw error;
}

async function defaultCountSearchDocuments(): Promise<number> {
  const supabase = createSupabaseAdminClient();
  const { count, error } = await supabase
    .from("search_documents")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error("Search index health probe failed");
  return count ?? 0;
}

async function defaultPingPostgresDirect(): Promise<number> {
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) throw new Error("Direct Postgres is not configured");

  const client = new pg.Client({
    ...createPgClientConfig(connectionString),
    connectionTimeoutMillis: HEALTH_TIMEOUT_MS,
    query_timeout: HEALTH_TIMEOUT_MS,
  });

  try {
    await client.connect();
    const { rows } = await client.query<{ c: number }>(
      "select count(*)::int as c from public.tripster_experiences",
    );
    return rows[0]?.c ?? 0;
  } finally {
    await client.end().catch(() => undefined);
  }
}

const DEFAULT_DEPENDENCIES: ProbeDependencies = {
  isSupabaseConfigured,
  hasDirectPostgres: () => Boolean(resolveDatabaseUrl()),
  pingSupabase: defaultPingSupabase,
  countSearchDocuments: defaultCountSearchDocuments,
  pingPostgresDirect: defaultPingPostgresDirect,
  describeDirectPostgres: resolveDatabaseConnectionDiagnostics,
  now: () => Date.now(),
};

export async function fetchPublicHealthSnapshotForTest(
  options: {
    pingDatabase?: boolean;
    includeSearchIndexCount?: boolean;
  },
  dependencies: ProbeDependencies,
): Promise<PublicHealthSnapshot> {
  const pingDatabase = options.pingDatabase ?? true;
  const includeSearchIndexCount = options.includeSearchIndexCount ?? true;
  const supabaseConfigured = dependencies.isSupabaseConfigured();
  const directPostgresConfigured = dependencies.hasDirectPostgres();
  const directPostgresConnection = dependencies.describeDirectPostgres();

  const databasePromise =
    pingDatabase && supabaseConfigured
      ? runProbe(dependencies.pingSupabase, dependencies.now)
      : Promise.resolve(null);
  const searchPromise =
    includeSearchIndexCount && supabaseConfigured
      ? runProbe(dependencies.countSearchDocuments, dependencies.now)
      : Promise.resolve(null);
  const postgresPromise = directPostgresConfigured
    ? runProbe(dependencies.pingPostgresDirect, dependencies.now)
    : Promise.resolve(null);

  const [databaseProbe, searchProbe, postgresProbe] = await Promise.all([
    databasePromise,
    searchPromise,
    postgresPromise,
  ]);

  const database: DependencyCheck = databaseProbe
    ? {
        required: true,
        ok: databaseProbe.ok,
        skipped: false,
        latencyMs: databaseProbe.latencyMs,
        error: databaseProbe.ok ? null : databaseProbe.error,
      }
    : {
        required: true,
        ok: false,
        skipped: true,
        latencyMs: null,
        error: supabaseConfigured && !pingDatabase ? null : "not_configured",
      };

  const searchIndex: PublicHealthSnapshot["checks"]["searchIndex"] = searchProbe
    ? {
        required: false,
        ok: searchProbe.ok,
        skipped: false,
        latencyMs: searchProbe.latencyMs,
        error: searchProbe.ok ? null : searchProbe.error,
        count: searchProbe.ok ? searchProbe.value : null,
      }
    : {
        required: false,
        ok: false,
        skipped: true,
        latencyMs: null,
        error: includeSearchIndexCount && !supabaseConfigured ? "not_configured" : null,
        count: null,
      };

  const postgresDirect: PublicHealthSnapshot["checks"]["postgresDirect"] = postgresProbe
    ? {
        required: true,
        ok: postgresProbe.ok,
        skipped: false,
        latencyMs: postgresProbe.latencyMs,
        error: postgresProbe.ok ? null : postgresProbe.error,
        tripsterCount: postgresProbe.ok ? postgresProbe.value : null,
        connection: directPostgresConnection,
      }
    : {
        required: true,
        ok: false,
        skipped: true,
        latencyMs: null,
        error: directPostgresConfigured
          ? null
          : directPostgresConnection?.targetStatus === "mismatch"
            ? "target_mismatch"
            : directPostgresConnection?.targetStatus === "unverified"
              ? "target_unverified"
              : "not_configured",
        tripsterCount: null,
        connection: directPostgresConnection,
      };

  const overall = resolveOverallHealth([database, searchIndex, postgresDirect]);
  const environment = getDeployEnvironment();

  return {
    ...overall,
    version: getAppVersion(),
    gitSha: getGitSha(),
    environment: {
      nodeEnv: environment.nodeEnv,
      deployEnv: environment.deployEnv,
    },
    migrationVersion: getLatestMigrationId(),
    checks: {
      database,
      migrations: {
        latestId: getLatestMigrationId(),
        fileCount: getMigrationFileCount(),
      },
      searchIndex,
      postgresDirect,
    },
    generatedAt: new Date().toISOString(),
  };
}

export async function fetchPublicHealthSnapshot(options?: {
  pingDatabase?: boolean;
  includeSearchIndexCount?: boolean;
}): Promise<PublicHealthSnapshot> {
  return fetchPublicHealthSnapshotForTest(options ?? {}, DEFAULT_DEPENDENCIES);
}
