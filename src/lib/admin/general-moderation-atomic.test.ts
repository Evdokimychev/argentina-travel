import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const source = (path: string) => readFileSync(join(root, path), "utf8");
const migration = source(
  "supabase/migrations/20260717050000_general_moderation_atomic_workflow.sql",
).toLowerCase();

describe("general moderation atomic workflow", () => {
  it("supports every shared moderation entity through one CAS resolver", () => {
    for (const entityType of [
      "tour",
      "review",
      "review_report",
      "forum_post",
      "author_article",
    ]) {
      expect(migration).toContain(`'${entityType}'`);
    }
    expect(migration).toContain("create or replace function public.admin_resolve_moderation_item_atomic");
    expect(migration).toContain("p_expected_queue_version bigint");
    expect(migration).toContain("p_expected_entity_version bigint");
    expect(migration).toContain("p_expected_related_version bigint default null");
    expect(migration).toContain("for update");
    const resolver = migration.slice(
      migration.indexOf("create or replace function public.admin_resolve_moderation_item_atomic"),
      migration.indexOf("revoke all on function public.admin_resolve_moderation_item_atomic"),
    );
    expect(resolver).toContain("security invoker");
    expect(resolver).not.toContain("security definer");
  });

  it("enqueues forum complaints in the report transaction", () => {
    const forumServer = source("src/lib/forum/forum-server.ts");
    expect(migration).toContain("create trigger forum_post_reports_enqueue_moderation");
    expect(migration).toContain("after insert on public.forum_post_reports");
    expect(forumServer).not.toContain('.from("moderation_queue").upsert');
  });

  it("commits entity, queue, audit and delivery intent in the database transaction", () => {
    expect(migration).toContain("update public.moderation_queue");
    expect(migration).toContain("insert into public.admin_audit_log");
    expect(migration).toContain("insert into public.moderation_delivery_outbox");
    expect(migration).toContain("moderation_entity_update_conflict");
    expect(migration).toContain("moderation_queue_update_conflict");
    expect(migration).not.toContain("compensat");
  });

  it("keeps delivery payloads free of contact data and restricts mutation to service role", () => {
    expect(migration).toContain("alter table public.moderation_delivery_outbox enable row level security");
    expect(migration).toContain("'contactemail'");
    expect(migration).toContain("'contactphone'");
    expect(migration).toContain("'reviewtext'");
    expect(migration).toContain("from public, anon, authenticated");
    expect(migration).toContain("to service_role");
  });

  it("requires the admin UI to return all optimistic state tokens", () => {
    const server = source("src/lib/admin/moderation-server.ts");
    const view = source("src/components/admin/views/ModerationView.tsx");
    const route = source("src/app/api/admin/moderation/[id]/route.ts");

    expect(server).toContain('supabase.rpc("admin_resolve_moderation_item_atomic"');
    expect(view).toContain("expectedQueueVersion: item.queueVersion");
    expect(view).toContain("expectedEntityVersion: item.entityVersion");
    expect(view).toContain("expectedRelatedVersion: item.relatedVersion");
    expect(route).toContain('result.code === "version_conflict"');
    expect(route).not.toContain("writeAdminAuditLog");
  });
});
