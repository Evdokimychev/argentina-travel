import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAppVersion, getGitSha } from "@/lib/monitoring/build-info";
import { getLatestMigrationId, getMigrationFileCount } from "@/lib/ops/migrations-version";

export type PublicHealthSnapshot = {
  ok: boolean;
  version: string;
  gitSha: string | null;
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
  };
  generatedAt: string;
};

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

  return {
    ok: databaseSkipped || databaseOk,
    version: getAppVersion(),
    gitSha: getGitSha(),
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
    },
    generatedAt: new Date().toISOString(),
  };
}
