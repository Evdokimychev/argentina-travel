import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { SERVICE_ROLE_ONLY_TABLES } from "./rls-audit-config.mjs";

const root = path.resolve(import.meta.dirname, "../..");
const migrationsDir = path.join(root, "supabase/migrations");
const migrationFiles = fs
  .readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();
const sql = migrationFiles
  .map((name) => fs.readFileSync(path.join(migrationsDir, name), "utf8"))
  .join("\n");
const grantsMigration = fs.readFileSync(
  path.join(migrationsDir, migrationFiles.at(-1)),
  "utf8",
);

function matches(pattern, source) {
  return new Set([...source.matchAll(pattern)].map((match) => match[1]));
}

function parsePolicies(source) {
  const policies = [];
  const pattern =
    /create\s+policy\s+(?:"[^"]+"|[a-z0-9_]+)\s+on\s+public\.([a-z0-9_]+)([\s\S]*?);/gi;
  for (const match of source.matchAll(pattern)) {
    const body = match[2];
    const command = body.match(/\bfor\s+(all|select|insert|update|delete)\b/i)?.[1]?.toLowerCase() ?? "all";
    const roles =
      body
        .match(/\bto\s+([a-z0-9_,\s]+?)(?=\busing\b|\bwith\s+check\b|$)/i)?.[1]
        ?.split(",")
        .map((role) => role.trim().toLowerCase())
        .filter(Boolean) ?? ["public"];
    policies.push({ table: match[1], command, roles });
  }
  return policies;
}

function parseClientGrants(source) {
  const grants = [];
  const pattern =
    /grant\s+([a-z,\s]+?)\s+on\s+table\s+([\s\S]+?)\s+to\s+(anon|authenticated)\s*;/gi;
  for (const match of source.matchAll(pattern)) {
    const privileges = match[1]
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);
    const tables = [...match[2].matchAll(/public\.([a-z0-9_]+)/gi)].map(
      (tableMatch) => tableMatch[1],
    );
    for (const table of tables) {
      for (const privilege of privileges) {
        grants.push({ role: match[3].toLowerCase(), table, privilege });
      }
    }
  }
  return grants;
}

function policyAllows(policies, grant) {
  return policies.some(
    (policy) =>
      policy.table === grant.table &&
      (policy.command === "all" || policy.command === grant.privilege) &&
      (policy.roles.includes(grant.role) || policy.roles.includes("public")),
  );
}

test("every public table enables RLS and the explicit grant migration is last", () => {
  const tables = matches(
    /create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-z0-9_]+)/gi,
    sql,
  );
  const rlsTables = matches(
    /alter\s+table\s+public\.([a-z0-9_]+)\s+enable\s+row\s+level\s+security/gi,
    sql,
  );

  assert.match(migrationFiles.at(-1), /_explicit_data_api_grants\.sql$/);
  assert.ok(tables.size >= 120, `expected the full schema, found ${tables.size} tables`);
  assert.deepEqual([...tables].sort(), [...rlsTables].sort());
});

test("new and legacy Supabase projects converge on explicit grants", () => {
  assert.match(
    grantsMigration,
    /revoke\s+all\s+privileges\s+on\s+all\s+tables\s+in\s+schema\s+public\s+from\s+anon\s*,\s*authenticated\s*;/i,
  );
  assert.match(
    grantsMigration,
    /grant\s+select\s*,\s*insert\s*,\s*update\s*,\s*delete\s+on\s+all\s+tables\s+in\s+schema\s+public\s+to\s+service_role\s*;/i,
  );
  assert.match(
    grantsMigration,
    /grant\s+usage\s*,\s*select\s*,\s*update\s+on\s+all\s+sequences\s+in\s+schema\s+public\s+to\s+service_role\s*;/i,
  );
});

test("client grants never exceed an RLS policy and anonymous access is read-only", () => {
  const policies = parsePolicies(sql);
  const grants = parseClientGrants(grantsMigration);

  assert.ok(grants.length > 0);
  for (const grant of grants) {
    assert.equal(
      SERVICE_ROLE_ONLY_TABLES.has(grant.table),
      false,
      `${grant.table} is service-role-only but granted to ${grant.role}`,
    );
    assert.equal(
      policyAllows(policies, grant),
      true,
      `${grant.role} ${grant.privilege} on ${grant.table} has no matching policy`,
    );
    if (grant.role === "anon") {
      assert.equal(grant.privilege, "select", `anonymous ${grant.privilege} is forbidden`);
    }
  }
});

test("anonymous booking and waitlist mutations stay behind trusted server clients", () => {
  const bookingRoute = fs.readFileSync(path.join(root, "src/app/api/bookings/route.ts"), "utf8");
  const waitlistRoute = fs.readFileSync(
    path.join(root, "src/app/api/tours/[slug]/waitlist/route.ts"),
    "utf8",
  );

  assert.match(bookingRoute, /insertCanonicalBookingAtomically\(admin,/);
  assert.match(waitlistRoute, /let\s+duplicateQuery\s*=\s*admin/);
  assert.match(waitlistRoute, /const\s*\{\s*data:\s*inserted[\s\S]*?=\s*await\s+admin\s*\.from\("tour_waitlist_entries"\)/);
  assert.doesNotMatch(
    grantsMigration,
    /grant\s+(?=[^;]*(?:insert|update|delete))[^;]+to\s+anon\s*;/i,
  );
});
