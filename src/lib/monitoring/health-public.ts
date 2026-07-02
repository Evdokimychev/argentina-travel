import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { resolveDatabaseUrl } from "@/lib/database-url";
import { getAppVersion, getGitSha } from "@/lib/monitoring/build-info";
import pg from "pg";
import { getDeployEnvironment } from "@/lib/ops/deploy-env";
import { getLatestMigrationId, getMigrationFileCount } from "@/lib/ops/migrations-version";

export type PublicHealthSnapshot = {
  ok: boolean;
  version: string;
  gitSha: string | null;
  environment: {
    nodeEnv: string;
    deployEnv: string;
  };
  migrationVersion: string | null;
  checks: {
    database: {
      ok: boolean;
      skipped: boolean;
      error: string | null;
    };
    migrations: {
      latestId: string | null;
      fileCount: number;
    };
    searchIndex: {
      count: number | null;
      skipped: boolean;
      error: string | null;
    };
    postgresDirect: {
      ok: boolean;
      tripsterCount: number | null;
      error: string | null;
    };
  };
  generatedAt: string;
};

async function pingPostgresDirect(): Promise<{
  ok: boolean;
  tripsterCount: number | null;
  error: string | null;
}> {
  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    return { ok: false, tripsterCount: null, error: "Postgres URL is not configured" };
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8_000,
  });

  try {
    await client.connect();
    const { rows } = await client.query<{ c: number }>(
      "select count(*)::int as c from public.tripster_experiences"
    );
    return { ok: true, tripsterCount: rows[0]?.c ?? 0, error: null };
  } catch (error) {
    return {
      ok: false,
      tripsterCount: null,
      error: error instanceof Error ? error.message : "Postgres ping failed",
    };
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function fetchPublicHealthSnapshot(options?: {
  pingDatabase?: boolean;
  includeSearchIndexCount?: boolean;
}): Promise<PublicHealthSnapshot> {
  const pingDatabase = options?.pingDatabase ?? true;
  const includeSearchIndexCount = options?.includeSearchIndexCount ?? true;
  let databaseOk = true;
  let databaseSkipped = false;
  let databaseError: string | null = null;

  let searchIndexCount: number | null = null;
  let searchIndexSkipped = false;
  let searchIndexError: string | null = null;

  if (pingDatabase && isSupabaseConfigured()) {
    try {
      const supabase = createSupabaseAdminClient();
      const { error } = await supabase.from("profiles").select("id").limit(1);
      databaseOk = !error;
      databaseError = error?.message ?? null;

      if (includeSearchIndexCount) {
        const { count, error: countError } = await supabase
          .from("search_documents")
          .select("*", { count: "exact", head: true });

        if (countError) {
          if (
            countError.message.toLowerCase().includes("does not exist") ||
            countError.message.toLowerCase().includes("relation")
          ) {
            searchIndexSkipped = true;
          } else {
            searchIndexError = countError.message;
          }
        } else {
          searchIndexCount = count ?? 0;
        }
      } else {
        searchIndexSkipped = true;
      }
    } catch (error) {
      databaseOk = false;
      databaseError = error instanceof Error ? error.message : "Database ping failed.";
    }
  } else {
    databaseSkipped = true;
    searchIndexSkipped = true;
  }

  const environment = getDeployEnvironment();
  const postgresDirect = await pingPostgresDirect();

  return {
    ok: databaseSkipped || databaseOk || postgresDirect.ok,
    version: getAppVersion(),
    gitSha: getGitSha(),
    environment: {
      nodeEnv: environment.nodeEnv,
      deployEnv: environment.deployEnv,
    },
    migrationVersion: getLatestMigrationId(),
    checks: {
      database: {
        ok: databaseOk,
        skipped: databaseSkipped,
        error: databaseError,
      },
      migrations: {
        latestId: getLatestMigrationId(),
        fileCount: getMigrationFileCount(),
      },
      searchIndex: {
        count: searchIndexCount,
        skipped: searchIndexSkipped,
        error: searchIndexError,
      },
      postgresDirect,
    },
    generatedAt: new Date().toISOString(),
  };
}
