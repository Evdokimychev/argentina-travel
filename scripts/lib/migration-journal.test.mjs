import assert from "node:assert/strict";
import test from "node:test";

import {
  PRODUCTION_CONFIRMATION,
  PRODUCTION_PROJECT_REF,
  assertMigrationTarget,
  buildMigrationPlan,
  databaseProjectRef,
  migrationChecksum,
} from "./migration-journal.mjs";

const productionUrl = `postgresql://postgres:secret@db.${PRODUCTION_PROJECT_REF}.supabase.co:5432/postgres`;
const stagingRef = "abcdefghijklmnopqrst";
const stagingUrl = `postgresql://postgres.${stagingRef}:secret@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`;

test("project refs are derived without exposing credentials", () => {
  assert.equal(databaseProjectRef(productionUrl), PRODUCTION_PROJECT_REF);
  assert.equal(databaseProjectRef(stagingUrl), stagingRef);
  assert.equal(databaseProjectRef("postgresql://localhost/postgres"), null);
});

test("migration targets fail closed around production", () => {
  assert.throws(() => assertMigrationTarget({}, stagingUrl), /MIGRATION_TARGET_ENVIRONMENT/);
  assert.throws(
    () => assertMigrationTarget({ MIGRATION_TARGET_ENVIRONMENT: "staging" }, productionUrl),
    /production Supabase project/,
  );
  assert.throws(
    () => assertMigrationTarget({ MIGRATION_TARGET_ENVIRONMENT: "production" }, productionUrl),
    /MIGRATION_PRODUCTION_CONFIRMATION/,
  );
  assert.deepEqual(
    assertMigrationTarget(
      {
        MIGRATION_TARGET_ENVIRONMENT: "production",
        MIGRATION_PRODUCTION_CONFIRMATION: PRODUCTION_CONFIRMATION,
      },
      productionUrl,
    ),
    { environment: "production", projectRef: PRODUCTION_PROJECT_REF },
  );
});

test("journal plan resumes cleanly and rejects drift or blind replay", () => {
  const migrations = [
    { id: "001_first", checksum: migrationChecksum("select 1") },
    { id: "002_second", checksum: migrationChecksum("select 2") },
  ];
  assert.deepEqual(buildMigrationPlan(migrations, [], 0), migrations);
  assert.deepEqual(
    buildMigrationPlan(
      migrations,
      [{ migration_id: "001_first", checksum: migrations[0].checksum }],
      5,
    ),
    [migrations[1]],
  );
  assert.throws(() => buildMigrationPlan(migrations, [], 1), /Refusing blind replay/);
  assert.throws(
    () => buildMigrationPlan(migrations, [{ migration_id: "legacy", checksum: "x" }], 1),
    /unknown id/,
  );
  assert.throws(
    () =>
      buildMigrationPlan(
        migrations,
        [{ migration_id: "001_first", checksum: "changed" }],
        1,
      ),
    /checksum changed/,
  );
});
