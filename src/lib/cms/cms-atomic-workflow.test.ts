import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20260717046000_cms_atomic_document_workflow.sql",
  "utf8",
);
const source = (path: string) => readFileSync(path, "utf8");

describe("atomic CMS workflow", () => {
  it("locks documents and rejects stale writes before revision, audit and outbox", () => {
    expect(migration).toContain("for update;");
    expect(migration).toContain("CMS_STALE_VERSION");
    expect(migration).toContain("row_version = row_version + 1");
    expect(migration).toContain("insert into public.content_revisions");
    expect(migration).toContain("insert into public.admin_audit_log");
    expect(migration).toContain("insert into public.cms_search_outbox");
  });

  it("requires publish authority for every public-state mutation", () => {
    expect(migration).toContain(
      "current_doc.status in ('published', 'scheduled') or next_status in ('published', 'scheduled')",
    );
    expect(migration).toContain("CMS_PUBLISH_PERMISSION_REQUIRED");
    const updateRoute = source("src/app/api/admin/content/documents/[id]/route.ts");
    expect(updateRoute).toContain('authorizeAdminRequest(request, "content.publish")');
    expect(updateRoute).toContain("current.status === \"published\"");
    expect(updateRoute).toContain("current.status === \"scheduled\"");
  });

  it("returns owner-facing version conflicts and sends the loaded version from editors", () => {
    const server = source("src/lib/cms/content-server.ts");
    const route = source("src/app/api/admin/content/documents/[id]/route.ts");
    const editor = source("src/components/admin/views/ContentDocumentEditorView.tsx");
    expect(server).toContain("Материал уже изменён в другой вкладке");
    expect(route).toContain("cmsMutationHttpStatus(result.code)");
    expect(route).toContain("expectedVersion: body.expectedVersion!");
    expect(editor).toContain("expectedVersion: doc.rowVersion");
    expect(editor).toContain("Снять материал с публикации и сохранить как черновик?");
  });

  it("publishes due schedules with row locks and CAS", () => {
    const scheduled = migration.slice(
      migration.indexOf("create or replace function public.cms_publish_due_scheduled_atomic"),
      migration.indexOf("create or replace function public.cms_import_documents_atomic"),
    );
    expect(scheduled).toContain("for update skip locked");
    expect(scheduled).toContain("p_expected_version => due_doc.row_version");
    expect(scheduled).toContain("p_operation => 'publish_scheduled'");
  });

  it("makes knowledge imports atomic and replayable by operation identity", () => {
    expect(migration).toContain("create table if not exists public.cms_import_operations");
    expect(migration).toContain("CMS_IMPORT_OPERATION_CONFLICT");
    expect(migration).toContain("operation_row.status = 'completed'");
    const route = source("src/app/api/admin/content/knowledge-import/route.ts");
    const view = source("src/components/admin/views/KnowledgeImportView.tsx");
    expect(route).toContain("importCmsDocumentsAtomic");
    expect(route).not.toContain("for (const candidate");
    expect(view).toContain("operationIdRef");
    expect(view).toContain("crypto.randomUUID()");
  });

  it("keeps privileged RPCs outside anonymous and authenticated access", () => {
    for (const signature of [
      "cms_create_document_atomic",
      "cms_mutate_document_atomic",
      "cms_publish_due_scheduled_atomic",
      "cms_import_documents_atomic",
    ]) {
      expect(migration).toMatch(
        new RegExp(`revoke all on function public\\.${signature}\\([\\s\\S]*?from public, anon, authenticated;`),
      );
    }
  });
});
