#!/usr/bin/env node
import pg from "pg";
import { resolveDatabaseUrl } from "./resolve-database-url.mjs";

const execute = process.argv.includes("--execute");
const emailArg = process.argv.find((arg) => arg.startsWith("--email="));
const email = emailArg?.slice("--email=".length).trim().toLowerCase();
if (!email || !email.includes("@")) {
  throw new Error("Usage: npm run auth:reconcile -- --email=user@example.com [--execute]");
}
const connectionString = resolveDatabaseUrl(process.env, { purpose: "auth profile reconciliation" });
if (!connectionString) throw new Error("An attested PostgreSQL target is required");

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const quote = (value) => `"${value.replaceAll('"', '""')}"`;

await client.connect();
try {
  await client.query("begin");
  const profiles = (await client.query(
    `select p.*, (u.id is not null) has_auth
       from public.profiles p left join auth.users u on u.id = p.id
      where lower(p.email) = $1 for update of p`,
    [email]
  )).rows;
  const orphan = profiles.find((profile) => !profile.has_auth);
  const target = profiles.find((profile) => profile.has_auth);
  if (!orphan || !target) throw new Error("Expected one orphan profile and one Auth-backed profile");

  const foreignKeys = (await client.query(`
    select ns.nspname schema_name, cl.relname table_name, a.attname column_name
      from pg_constraint co
      join pg_class cl on cl.oid = co.conrelid
      join pg_namespace ns on ns.oid = cl.relnamespace
      join pg_class ref on ref.oid = co.confrelid
      join pg_namespace rns on rns.oid = ref.relnamespace
      join unnest(co.conkey) with ordinality ck(attnum, ord) on true
      join pg_attribute a on a.attrelid = co.conrelid and a.attnum = ck.attnum
     where co.contype = 'f' and rns.nspname = 'public' and ref.relname = 'profiles'
  `)).rows;

  let movedRows = 0;
  for (const fk of foreignKeys) {
    const result = await client.query(
      `update ${quote(fk.schema_name)}.${quote(fk.table_name)}
          set ${quote(fk.column_name)} = $1 where ${quote(fk.column_name)} = $2`,
      [target.id, orphan.id]
    );
    movedRows += result.rowCount ?? 0;
  }

  const roles = [...new Set([...(orphan.roles ?? []), ...(target.roles ?? []), "tourist"])]
    .filter((role) => ["tourist", "organizer", "admin"].includes(role));
  await client.query(
    `update public.profiles target set
       first_name = coalesce(nullif(source.first_name, ''), target.first_name),
       last_name = coalesce(nullif(source.last_name, ''), target.last_name),
       phone = coalesce(source.phone, target.phone),
       avatar_url = coalesce(source.avatar_url, target.avatar_url),
       country = coalesce(nullif(source.country, ''), target.country),
       date_of_birth = coalesce(source.date_of_birth, target.date_of_birth),
       roles = $3, active_role = 'admin', is_blocked = false
      from public.profiles source where target.id = $1 and source.id = $2`,
    [target.id, orphan.id, roles]
  );
  await client.query(
    `insert into public.admin_audit_log
       (actor_user_id, action, entity_type, entity_id, payload)
     values ($1::uuid, 'auth_profile_reconcile', 'profile', $1::text, $2::jsonb)`,
    [
      target.id,
      JSON.stringify({
        previousOrphanProfile: Object.fromEntries(
          Object.entries(orphan).filter(([key]) => key !== "has_auth")
        ),
        previousTargetProfile: Object.fromEntries(
          Object.entries(target).filter(([key]) => key !== "has_auth")
        ),
        movedRows,
      }),
    ]
  );
  await client.query("delete from public.profiles where id = $1", [orphan.id]);

  console.log(`Mode: ${execute ? "execute" : "dry-run"}`);
  console.log("Profiles to reconcile: 1");
  console.log(`Related rows to move: ${movedRows}`);
  console.log(`Resulting roles: ${roles.join(", ")}`);
  if (execute) {
    await client.query("commit");
    console.log("Reconciliation committed");
  } else {
    await client.query("rollback");
    console.log("Dry run rolled back; no data changed");
  }
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
