import assert from "node:assert/strict";
import test from "node:test";

import {
  assertDatabaseTarget,
  assertDistinctDatabaseTargets,
  parseSupabaseDatabaseTarget,
  resolveAttestedDatabaseUrl,
  resolveTrustedSupabaseProjectRef,
} from "./database-target-attestation.mjs";

const canonicalRef = "uooxrypocahomoqzdvzy";
const otherRef = "abcdefghijklmnopqrst";
const direct = (ref = canonicalRef) =>
  `postgresql://postgres:secret@db.${ref}.supabase.co:5432/postgres?sslmode=require`;
const pooler = (ref = canonicalRef, port = 6543) =>
  `postgresql://postgres.${ref}:secret@aws-0-sa-east-1.pooler.supabase.com:${port}/postgres`;

test("strictly parses official direct and shared-pooler targets", () => {
  assert.deepEqual(parseSupabaseDatabaseTarget(direct()), {
    mode: "supabase_direct",
    port: 5432,
    projectRef: canonicalRef,
    targetStatus: "unverified",
    local: false,
  });
  assert.equal(parseSupabaseDatabaseTarget(pooler()).projectRef, canonicalRef);
  assert.equal(parseSupabaseDatabaseTarget(pooler()).mode, "supabase_transaction");
  assert.equal(
    parseSupabaseDatabaseTarget(
      `postgresql://postgres.${canonicalRef}:secret@evil-pooler.supabase.com.attacker.test:5432/postgres`,
    ).projectRef,
    null,
  );
  assert.equal(
    parseSupabaseDatabaseTarget(
      `postgresql://postgres.${canonicalRef}.suffix:secret@pooler.supabase.com:5432/postgres`,
    ).projectRef,
    null,
  );
});

test("attestation rejects generic and mismatched targets without leaking secrets", () => {
  const generic = "postgresql://admin:super-secret@generic.example.com:5432/app?token=hidden";
  for (const url of [generic, direct(otherRef)]) {
    let message = "";
    try {
      assertDatabaseTarget({ connectionString: url, expectedProjectRef: canonicalRef, purpose: "test" });
    } catch (error) {
      message = error.message;
    }
    assert.ok(message);
    assert.doesNotMatch(message, /super-secret|generic\.example|admin|token=hidden/);
  }
  assert.equal(
    assertDatabaseTarget({ connectionString: direct(), expectedProjectRef: canonicalRef }).diagnostics.targetStatus,
    "verified",
  );
});

test("local targets require an explicit opt-in", () => {
  const local = "postgresql://postgres:secret@localhost:5432/postgres";
  assert.throws(
    () => assertDatabaseTarget({ connectionString: local, expectedProjectRef: canonicalRef }),
    /not an attested Supabase project/,
  );
  assert.equal(
    assertDatabaseTarget({ connectionString: local, allowLocal: true }).diagnostics.targetStatus,
    "verified",
  );
});

test("trusted project identity must agree across independent channels", () => {
  assert.equal(
    resolveTrustedSupabaseProjectRef({
      SUPABASE_PROJECT_REF: canonicalRef,
      NEXT_PUBLIC_SUPABASE_URL: `https://${canonicalRef}.supabase.co`,
    }),
    canonicalRef,
  );
  assert.throws(
    () =>
      resolveTrustedSupabaseProjectRef({
        SUPABASE_PROJECT_REF: canonicalRef,
        NEXT_PUBLIC_SUPABASE_URL: `https://${otherRef}.supabase.co`,
      }),
    /disagree/,
  );
});

test("resolver skips rejected higher-precedence candidates and normalizes verified pooler", () => {
  const result = resolveAttestedDatabaseUrl(
    {
      DATABASE_URL: "postgresql://admin:secret@generic.example.com/postgres",
      POSTGRES_URL_NON_POOLING: pooler(canonicalRef),
    },
    { expectedProjectRef: canonicalRef, purpose: "test" },
  );
  assert.equal(result.source, "POSTGRES_URL_NON_POOLING");
  assert.equal(result.diagnostics.targetStatus, "verified");
  assert.equal(result.diagnostics.mode, "supabase_session");
  assert.equal(new URL(result.connectionString).port, "5432");
});

test("cross-target operations require two distinct attestations", () => {
  assert.equal(
    assertDistinctDatabaseTargets({
      sourceConnectionString: direct(otherRef),
      sourceProjectRef: otherRef,
      targetConnectionString: direct(canonicalRef),
      targetProjectRef: canonicalRef,
      productionProjectRef: canonicalRef,
      allowProductionTarget: true,
    }).target.diagnostics.projectRef,
    canonicalRef,
  );
  assert.throws(
    () =>
      assertDistinctDatabaseTargets({
        sourceConnectionString: direct(otherRef),
        sourceProjectRef: otherRef,
        targetConnectionString: direct(canonicalRef),
        targetProjectRef: canonicalRef,
        productionProjectRef: canonicalRef,
      }),
    /explicit confirmation/,
  );
  assert.throws(
    () =>
      assertDistinctDatabaseTargets({
        sourceConnectionString: direct(canonicalRef),
        sourceProjectRef: canonicalRef,
        targetConnectionString: pooler(canonicalRef, 5432),
        targetProjectRef: canonicalRef,
      }),
    /must be distinct/,
  );
});
