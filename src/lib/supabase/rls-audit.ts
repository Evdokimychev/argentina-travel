import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import pg from "pg";
import { isServiceRoleOnlyTable } from "@/lib/supabase/rls-audit-config";
import type { StaticRlsAuditIssue } from "@/lib/supabase/rls-audit-static";
import type { Database } from "@/types/database";

export type RlsAuditTable = {
  table: string;
  rlsEnabled: boolean;
  policyCount?: number;
};

export type RlsAuditResult = {
  ok: boolean;
  tables: RlsAuditTable[];
  error: string | null;
  criticalIssues?: StaticRlsAuditIssue[];
};

function getDatabaseUrl(): string | null {
  return process.env.DATABASE_URL?.trim() ?? null;
}

type SupabaseSchemaClient = SupabaseClient<Database> & {
  schema: (schema: string) => SupabaseClient<Database>;
};

async function fetchViaSupabaseCatalog(
  supabase: SupabaseClient<Database>
): Promise<{ tables: RlsAuditTable[]; error: string | null }> {
  try {
    const schemaClient = (supabase as SupabaseSchemaClient).schema("pg_catalog");

    const { data: tablesData, error: tablesError } = (await schemaClient
      .from("pg_tables")
      .select("tablename")
      .eq("schemaname", "public")
      .order("tablename", { ascending: true })) as {
      data: Array<{ tablename: string }> | null;
      error: { message: string } | null;
    };
    if (tablesError) {
      return { tables: [], error: tablesError.message };
    }

    const tableNames = (tablesData ?? [])
      .map((row) => row.tablename)
      .filter((name): name is string => Boolean(name));

    if (tableNames.length === 0) {
      return { tables: [], error: null };
    }

    const { data: classData, error: classError } = (await schemaClient
      .from("pg_class")
      .select("relname, relrowsecurity")
      .in("relname", tableNames)) as {
      data: Array<{ relname: string; relrowsecurity: boolean | null }> | null;
      error: { message: string } | null;
    };
    if (classError) {
      return { tables: [], error: classError.message };
    }

    const rlsByTable = new Map<string, boolean>();
    for (const row of classData ?? []) {
      rlsByTable.set(row.relname, Boolean(row.relrowsecurity));
    }

    return {
      tables: tableNames.map((table) => ({
        table,
        rlsEnabled: rlsByTable.get(table) ?? false,
      })),
      error: null,
    };
  } catch (error) {
    return {
      tables: [],
      error: error instanceof Error ? error.message : "Failed to query pg_catalog via Supabase",
    };
  }
}

async function fetchViaDirectPg(): Promise<{ tables: RlsAuditTable[]; error: string | null }> {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    return { tables: [], error: "DATABASE_URL is not configured" };
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const { rows } = await client.query<{
      table_name: string;
      rls_enabled: boolean;
      policy_count: string;
    }>(
      `select
         t.tablename as table_name,
         c.relrowsecurity as rls_enabled,
         count(p.policyname)::text as policy_count
       from pg_catalog.pg_tables t
       join pg_catalog.pg_namespace n on n.nspname = t.schemaname
       join pg_catalog.pg_class c on c.relname = t.tablename and c.relnamespace = n.oid
       left join pg_catalog.pg_policies p
         on p.schemaname = t.schemaname and p.tablename = t.tablename
       where t.schemaname = 'public'
       group by t.tablename, c.relrowsecurity
       order by t.tablename asc`
    );

    return {
      tables: rows.map((row) => ({
        table: row.table_name,
        rlsEnabled: Boolean(row.rls_enabled),
        policyCount: Number.parseInt(row.policy_count, 10) || 0,
      })),
      error: null,
    };
  } catch (error) {
    return {
      tables: [],
      error: error instanceof Error ? error.message : "Failed to query pg_catalog via DATABASE_URL",
    };
  } finally {
    await client.end().catch(() => undefined);
  }
}

export function evaluateCriticalRlsIssues(tables: RlsAuditTable[]): StaticRlsAuditIssue[] {
  const issues: StaticRlsAuditIssue[] = [];

  for (const row of tables) {
    if (!row.rlsEnabled) {
      issues.push({
        table: row.table,
        kind: "missing_rls",
        message: `Таблица public.${row.table} без включённого RLS`,
      });
      continue;
    }

    const policyCount = row.policyCount ?? 0;
    if (!isServiceRoleOnlyTable(row.table) && policyCount === 0) {
      issues.push({
        table: row.table,
        kind: "missing_policies",
        message: `Таблица public.${row.table} без политик RLS`,
      });
    }
  }

  return issues;
}

export async function fetchPublicTablesRlsAudit(
  supabase: SupabaseClient<Database>
): Promise<RlsAuditResult> {
  const pgResult = await fetchViaDirectPg();
  if (pgResult.tables.length > 0 || pgResult.error) {
    const criticalIssues = evaluateCriticalRlsIssues(pgResult.tables);
    return {
      ok: pgResult.error === null && criticalIssues.length === 0,
      tables: pgResult.tables,
      error: pgResult.error,
      criticalIssues,
    };
  }

  const supabaseResult = await fetchViaSupabaseCatalog(supabase);
  const criticalIssues = evaluateCriticalRlsIssues(supabaseResult.tables);
  return {
    ok: supabaseResult.error === null && criticalIssues.length === 0,
    tables: supabaseResult.tables,
    error: supabaseResult.error,
    criticalIssues,
  };
}
