import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = fs.readFileSync(path.join(root, "supabase/migrations/20260719173719_argentina_knowledge_native_ingestion.sql"), "utf8");
const pipeline = fs.readFileSync(path.join(root, "src/lib/ingestion/pipeline-server.ts"), "utf8");
const migrationScript = fs.readFileSync(path.join(root, "scripts/migrate-argentina-knowledge.ts"), "utf8");
const dispatcherWorkflow = fs.readFileSync(path.join(root, ".github/workflows/ingestion-dispatch.yml"), "utf8");

describe("native ingestion architecture contract", () => {
  it("keeps operational tables private and raw media in a private bucket", () => {
    expect(migration).toContain("alter table public.ingestion_sources enable row level security");
    expect(migration).toContain("from anon, authenticated");
    expect(migration).toContain("'ingestion-raw'");
    expect(migration).toContain("false,");
  });

  it("cannot automatically publish a collected article", () => {
    expect(pipeline).toContain('status: "draft"');
    expect(pipeline).not.toContain('status: "published", actorId');
    expect(pipeline).toContain('seo: { description: candidate.summary.slice(0, 160), noIndex: true }');
  });

  it("migrates with checksums and an idempotency ledger", () => {
    expect(migrationScript).toContain("ingestion_migration_ledger");
    expect(migrationScript).toContain("onConflict: \"migration_id,source_system,entity_type,legacy_id\"");
    expect(migrationScript).toContain("ingestion-raw");
  });

  it("dispatches due sources every 15 minutes without a duplicate Vercel cron", () => {
    expect(dispatcherWorkflow).toContain('cron: "*/15 * * * *"');
    expect(dispatcherWorkflow).toContain("/api/cron/ingestion");
    expect(dispatcherWorkflow).toContain("secrets.CRON_SECRET");
  });
});
