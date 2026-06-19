import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import pg from "pg";
import type { Database } from "@/types/database";

export type RlsAuditTable = {
  table: string;
  rlsEnabled: boolean;
};

export type RlsAuditResult = {
  ok: boolean;
  tables: RlsAuditTable[];
  error: string | null;
};

function getDatabaseUrl(): string | null {
  return process.env.DATABASE_URL?.trim() ?? null;
}

async function fetchViaSupabaseCatalog(
  supabase: SupabaseClient<Database>
): Promise<{ tables: RlsAuditTable[]; error: string | null }> {
  try {
    const schemaClient = (supabase as any).schema("pg_catalog");

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
    }>(
      `select t.tablename as table_name, c.relrowsecurity as rls_enabled
       from pg_catalog.pg_tables t
       join pg_catalog.pg_namespace n on n.nspname = t.schemaname
       join pg_catalog.pg_class c on c.relname = t.tablename and c.relnamespace = n.oid
       where t.schemaname = 'public'
       order by t.tablename asc`
    );

    return {
      tables: rows.map((row) => ({
        table: row.table_name,
        rlsEnabled: Boolean(row.rls_enabled),
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

export async function fetchPublicTablesRlsAudit(
  supabase: SupabaseClient<Database>
): Promise<RlsAuditResult> {
  const supabaseResult = await fetchViaSupabaseCatalog(supabase);
  if (supabaseResult.tables.length > 0 || !supabaseResult.error) {
    return { ok: supabaseResult.error === null, tables: supabaseResult.tables, error: supabaseResult.error };
  }

  const pgResult = await fetchViaDirectPg();
  return { ok: pgResult.error === null, tables: pgResult.tables, error: pgResult.error };
}
