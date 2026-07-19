import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migration = fs.readFileSync(
  path.join(
    root,
    "supabase/migrations/20260715041742_content_knowledge_governance.sql"
  ),
  "utf8"
);
const contentServer = fs.readFileSync(path.join(root, "src/lib/cms/content-server.ts"), "utf8");

describe("content governance publication boundary", () => {
  it("guards content and governance updates while a document is public", () => {
    expect(migration).toMatch(
      /before update of status, title, body, workflow_stage, risk_level, reviewer_id,\s+last_fact_checked_at, next_review_at/
    );
    expect(migration).toContain("content_publication_gate:missing_active_source");
    expect(migration).toContain("content_publication_gate:missing_or_invalid_claims");
    expect(migration).toContain("content_publication_gate:media_rights_incomplete");
  });

  it("sends the exact scheduled draft through the atomic database gate", () => {
    const scheduleStart = contentServer.indexOf("export async function scheduleCmsDocument");
    const scheduleEnd = contentServer.indexOf("export async function cancelCmsDocumentSchedule");
    const scheduleSource = contentServer.slice(scheduleStart, scheduleEnd);
    expect(scheduleSource).toContain('p_operation: "schedule"');
    expect(scheduleSource).toContain("p_title: input.title ?? null");
    expect(scheduleSource).toContain("p_body: input.body === undefined");
    expect(scheduleSource).toContain("p_seo: input.seo === undefined");
    expect(scheduleSource).toContain("p_allow_publish: true");
  });

  it("keeps governance RPC and trigger execution server-only", () => {
    expect(migration).toContain(
      "revoke all on function public.content_publication_gate(text) from public, anon, authenticated"
    );
    expect(migration).toContain(
      "revoke all on function public.enforce_content_publication_gate() from public, anon, authenticated"
    );
  });
});
