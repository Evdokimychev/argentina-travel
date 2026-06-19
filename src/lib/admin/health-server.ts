import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchPublicTablesRlsAudit } from "@/lib/supabase/rls-audit";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

type SyncProviderStatus = {
  ok: boolean;
  configured: boolean;
  source: "db" | "env";
  lastRun: {
    status: string;
    startedAt: string;
    finishedAt: string | null;
    experiencesSynced: number;
    citiesSynced: number;
    errorMessage: string | null;
  } | null;
  error: string | null;
};

export type AdminHealthSnapshot = {
  ok: boolean;
  checks: {
    database: {
      ok: boolean;
      error: string | null;
    };
    rls: {
      ok: boolean;
      publicTableCount: number;
      tablesWithoutRls: string[];
      tablesMissingPolicies: string[];
      criticalIssueCount: number;
      error: string | null;
    };
    sync: {
      ok: boolean;
      tripster: SyncProviderStatus;
      sputnik8: SyncProviderStatus;
    };
  };
  generatedAt: string;
};

function isMissingSchemaError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("relation") ||
    normalized.includes("column") ||
    normalized.includes("schema") ||
    normalized.includes("does not exist")
  );
}

async function fetchSyncProviderStatus(
  supabase: DbClient,
  provider: "tripster" | "sputnik8"
): Promise<SyncProviderStatus> {
  const table = provider === "tripster" ? "tripster_sync_runs" : "sputnik8_sync_runs";
  const configured =
    provider === "tripster"
      ? Boolean(process.env.TRIPSTER_PARTNER?.trim() && process.env.TRIPSTER_SECRET?.trim())
      : Boolean(process.env.SPUTNIK8_API_KEY?.trim() && process.env.SPUTNIK8_USERNAME?.trim());

  const { data, error } = await supabase
    .from(table)
    .select("status, started_at, finished_at, experiences_synced, cities_synced, error_message")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingSchemaError(error.message)) {
      return {
        ok: true,
        configured,
        source: "env",
        lastRun: null,
        error: null,
      };
    }

    return {
      ok: false,
      configured,
      source: "db",
      lastRun: null,
      error: error.message,
    };
  }

  if (!data) {
    return {
      ok: true,
      configured,
      source: "db",
      lastRun: null,
      error: null,
    };
  }

  return {
    ok: true,
    configured,
    source: "db",
    lastRun: {
      status: data.status,
      startedAt: data.started_at,
      finishedAt: data.finished_at,
      experiencesSynced: data.experiences_synced,
      citiesSynced: data.cities_synced,
      errorMessage: data.error_message,
    },
    error: null,
  };
}

export async function fetchAdminHealthSnapshot(supabase: DbClient): Promise<AdminHealthSnapshot> {
  const [databasePing, rlsAudit, tripsterSync, sputnik8Sync] = await Promise.all([
    supabase.from("profiles").select("id").limit(1),
    fetchPublicTablesRlsAudit(supabase),
    fetchSyncProviderStatus(supabase, "tripster"),
    fetchSyncProviderStatus(supabase, "sputnik8"),
  ]);

  const databaseOk = !databasePing.error;
  const rlsMissing = rlsAudit.tables.filter((table) => !table.rlsEnabled).map((table) => table.table);
  const rlsMissingPolicies =
    rlsAudit.criticalIssues?.filter((issue) => issue.kind === "missing_policies").map((issue) => issue.table) ??
    [];
  const criticalIssueCount = rlsAudit.criticalIssues?.length ?? rlsMissing.length + rlsMissingPolicies.length;
  const syncOk = tripsterSync.ok && sputnik8Sync.ok;

  const checks = {
    database: {
      ok: databaseOk,
      error: databasePing.error?.message ?? null,
    },
    rls: {
      ok: rlsAudit.ok,
      publicTableCount: rlsAudit.tables.length,
      tablesWithoutRls: rlsMissing,
      tablesMissingPolicies: rlsMissingPolicies,
      criticalIssueCount,
      error: rlsAudit.error,
    },
    sync: {
      ok: syncOk,
      tripster: tripsterSync,
      sputnik8: sputnik8Sync,
    },
  };

  const overallOk = checks.database.ok && checks.rls.ok && checks.sync.ok;

  return {
    ok: overallOk,
    checks,
    generatedAt: new Date().toISOString(),
  };
}
