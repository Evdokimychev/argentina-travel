import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAppVersion, getGitSha } from "@/lib/monitoring/build-info";

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
  };
  generatedAt: string;
};

export async function fetchPublicHealthSnapshot(options?: {
  pingDatabase?: boolean;
}): Promise<PublicHealthSnapshot> {
  const pingDatabase = options?.pingDatabase ?? true;
  let databaseOk = true;
  let databaseSkipped = false;
  let databaseError: string | null = null;

  if (pingDatabase && isSupabaseConfigured()) {
    try {
      const supabase = createSupabaseAdminClient();
      const { error } = await supabase.from("profiles").select("id").limit(1);
      databaseOk = !error;
      databaseError = error?.message ?? null;
    } catch (error) {
      databaseOk = false;
      databaseError = error instanceof Error ? error.message : "Database ping failed.";
    }
  } else {
    databaseSkipped = true;
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
    },
    generatedAt: new Date().toISOString(),
  };
}
