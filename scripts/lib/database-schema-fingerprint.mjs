import { createHash } from "node:crypto";

export const DATABASE_SCHEMA_INVENTORY_SQL = `
  with schema_objects as (
    select
      'table'::text as object_kind,
      c.relname::text as object_identity,
      jsonb_build_object(
        'relkind', c.relkind,
        'rls', c.relrowsecurity,
        'force_rls', c.relforcerowsecurity
      )::text as definition
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p', 'v', 'm')

    union all

    select
      'column',
      format('%s.%s', table_name, column_name),
      jsonb_build_object(
        'ordinal', ordinal_position,
        'type', data_type,
        'udt', udt_name,
        'nullable', is_nullable,
        'default', column_default,
        'identity', is_identity,
        'generated', is_generated
      )::text
    from information_schema.columns
    where table_schema = 'public'

    union all

    select
      'constraint',
      format('%s.%s', c.relname, con.conname),
      jsonb_build_object(
        'type', con.contype,
        'definition', pg_get_constraintdef(con.oid, true)
      )::text
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'

    union all

    select
      'index',
      format('%s.%s', tablename, indexname),
      indexdef
    from pg_indexes
    where schemaname = 'public'

    union all

    select
      'policy',
      format('%s.%s', tablename, policyname),
      jsonb_build_object(
        'permissive', permissive,
        'roles', roles,
        'command', cmd,
        'using', qual,
        'check', with_check
      )::text
    from pg_policies
    where schemaname = 'public'

    union all

    select
      'function',
      format('%s(%s)', p.proname, pg_get_function_identity_arguments(p.oid)),
      pg_get_functiondef(p.oid)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind in ('f', 'p')

    union all

    select
      'trigger',
      format('%s.%s', c.relname, t.tgname),
      pg_get_triggerdef(t.oid, true)
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and not t.tgisinternal

    union all

    select
      'grant',
      format('%s.%s.%s', table_name, grantee, privilege_type),
      jsonb_build_object('grantable', is_grantable)::text
    from information_schema.role_table_grants
    where table_schema = 'public'
      and grantee in ('anon', 'authenticated', 'service_role')
  )
  select object_kind, object_identity, definition
  from schema_objects
  order by object_kind, object_identity, definition
`;

export function normalizeSchemaInventory(rows) {
  return rows
    .map((row) => ({
      kind: String(row.object_kind),
      identity: String(row.object_identity),
      definition: String(row.definition ?? ""),
    }))
    .sort((left, right) =>
      `${left.kind}\u0000${left.identity}\u0000${left.definition}`.localeCompare(
        `${right.kind}\u0000${right.identity}\u0000${right.definition}`,
      ),
    );
}

export function fingerprintSchemaInventory(rows) {
  const normalized = normalizeSchemaInventory(rows);
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex");
  const counts = {};
  for (const row of normalized) counts[row.kind] = (counts[row.kind] ?? 0) + 1;
  return { fingerprint, objectCount: normalized.length, counts };
}
